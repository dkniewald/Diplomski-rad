import React from 'react';
import './excel.styles.scss';
import axios from 'axios';
import ResultsMetaDataContainer from '../../components/results-metadata-container/results-metadata-container.component';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';


class Excel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            selectedFileName: "",
            text: '',
            x: '',
            y: '',
            isFileUploaded: false,
            errorMessage: "",
            backendURL: props.backendURL,
            results: [],
            isLoading: false,
            elapsedTime: 0,
            inputCoordinateSystem: 'HTRS96/TM (EPSG:3765)',
            outputCoordinateSystem: 'HTRS96/TM (EPSG:3765)',
        };
        this.timer = null;
    }

    handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel')) {
            this.setState({ selectedFile: file, selectedFileName: file.name, isFileUploaded: true, errorMessage: "" });
        } else {
            this.setState({ selectedFile: null, selectedFileName: file ? file.name : "", isFileUploaded: false, errorMessage: "Please upload a valid Excel file (.xls or .xlsx)" });
        }
    }

    handleInputChange = (field) => (event) => {
        this.setState({ [field]: event.target.value });
    }

    handleDropdownChange = (field) => (event) => {
        this.setState({ [field]: event.target.value });
    }

    isFormValid = () => {
        return this.state.text && this.state.x && this.state.y && this.state.isFileUploaded;
    }

    downloadExcel = () => {
        const excelData = JSON.parse(this.state.results.excel_data); // Parse the string into JSON
    
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
    
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], {type: fileType});
    
        let fileName = this.state.selectedFileName.split('.').slice(0, -1).join('.');

        FileSaver.saveAs(data, `${fileName}-geoparsed${fileExtension}`);
    };

    handleSubmit = (event) => {
        event.preventDefault();
        if (!this.isFormValid()) {
            this.setState({ errorMessage: "All fields are required" });
            return;
        }
        const formData = new FormData();
        formData.append('file', this.state.selectedFile);
        formData.append('text', this.state.text);
        formData.append('x', this.state.x);
        formData.append('y', this.state.y);
        formData.append('inputCoordinateSystem', this.state.inputCoordinateSystem);
        formData.append('outputCoordinateSystem', this.state.outputCoordinateSystem);

        this.setState({ isLoading: true, elapsedTime: 0 });

        this.timer = setInterval(() => {
            this.setState((prevState) => ({
                elapsedTime: prevState.elapsedTime + 1,
            }));
        }, 1000);

        axios.post(`${this.state.backendURL}/upload_excel`, formData)
            .then(response => {
                clearInterval(this.timer);
                this.setState({
                    results: response.data,
                    isLoading: false,
                    elapsedTime: 0,
                });
            })
            .catch(error => {
                clearInterval(this.timer);
                console.log(error);
                this.setState({
                    isLoading: false,
                    elapsedTime: 0,
                });
            });
    }

    render() {
        const {
            selectedFileName,
            text,
            x,
            y,
            errorMessage,
            results,
            isLoading,
            elapsedTime,
            inputCoordinateSystem,
            outputCoordinateSystem
        } = this.state;

        const showResults = results.data != null;

       
        const coordinateSystemsInput = [
            'HTRS96/TM (EPSG:3765)', 
            'WGS84 (EPSG:4326)', 
            'Balkan zone 5 (EPSG:8677)', 
            'Balkan zone 6 (EPSG:8678)'
        ];

        const coordinateSystemsOutput = [
            'HTRS96/TM (EPSG:3765)', 
            'WGS84 (EPSG:4326)'
        ];

        let wordNotFound = 0;
        let wordFoundSucc = 0;
        let wordFoundFail = 0;

        return (
            <div className="upload-container">
                <h2>Excel Upload</h2>
                <form onSubmit={this.handleSubmit}>
                    <label className="file-input">
                        Choose File
                        <input type="file" onChange={this.handleFileChange} hidden />
                        <span>{selectedFileName}</span>
                    </label>
                    {errorMessage && <p>{errorMessage}</p>}
                    <input
                        type="text"
                        placeholder="Excel column with text which will be geoparsed"
                        value={text}
                        onChange={this.handleInputChange('text')}
                    />
                    <input
                        type="text"
                        placeholder="Excel column which has longitude"
                        value={x}
                        onChange={this.handleInputChange('x')}
                    />
                    <input
                        type="text"
                        placeholder="Excel column which has latitude"
                        value={y}
                        onChange={this.handleInputChange('y')}
                    />
                    <label>
                        Input Coordinate System:
                        <select value={inputCoordinateSystem} onChange={this.handleDropdownChange('inputCoordinateSystem')}>
                            {coordinateSystemsInput.map((coordinateSystem) => <option key={coordinateSystem} value={coordinateSystem}>{coordinateSystem}</option>)}
                        </select>
                    </label>
                    <label>
                        Output Coordinate System:
                        <select value={outputCoordinateSystem} onChange={this.handleDropdownChange('outputCoordinateSystem')}>
                            {coordinateSystemsOutput.map((coordinateSystem) => <option key={coordinateSystem} value={coordinateSystem}>{coordinateSystem}</option>)}
                        </select>
                    </label>
                    <button type="submit" disabled={!this.isFormValid() || isLoading}>
                        {isLoading ? (
                            <div>
                                Processing... (Time Elapsed: {elapsedTime} seconds)
                            </div>
                        ) : (
                            'Process File'
                        )}
                    </button>
                </form>
                {showResults && (
                    <div className="results-container">
                        <h1>Results</h1>
                        <div className="buttonExcel-container">
                            <button className="buttonExcel" onClick={this.downloadExcel}>Download Excel</button>
                        </div>
                        <div className='results-header-container'>
                            <h2>User data</h2>
                            <h2>Geoparsed data</h2>
                            <h3>Text</h3>
                            <h3>Coordinates</h3>
                            <h3>Place Name</h3>
                            <h3>Country</h3>
                            <h3>Region</h3>
                            <h3>Lat</h3>
                            <h3>Lon</h3>
                            <h3>Distance</h3>
                            <h3>Success</h3>
                        </div>
                        {results.data.map(result => {
                            const geo = result.geoparsed != null ? result.geoparsed.geo : null;

                            if (result.rating === 0) {
                                wordNotFound++;
                            } else if (result.rating === 1) {
                                wordFoundSucc++;
                            } else if (result.rating === 2) {
                                wordFoundFail++;
                            }

                            return (
                                <ResultsMetaDataContainer
                                    text={result.requested[0]}
                                    coordinates={result.requested[1]}
                                    placeName={geo ? geo.place_name : 'N/A'}
                                    country={geo ? geo.country_code3 : 'N/A'}
                                    region={geo ? geo.admin1 : 'N/A'}
                                    lat={geo ? geo.lat : 'N/A'}
                                    lon={geo ? geo.lon : 'N/A'}
                                    rating={result.rating}
                                    distance = {result.distance}
                                />
                            );
                        })}

                    <div className='counters-container'>
                        <p>Location Not Found: {wordNotFound}</p>
                        <p>Location Found Successfully: {wordFoundSucc}</p>
                        <p>Location Found but wrong prediction: {wordFoundFail}</p>
                    </div>
                    </div>
                )}
            </div>
        );
    }
}

export default Excel;
