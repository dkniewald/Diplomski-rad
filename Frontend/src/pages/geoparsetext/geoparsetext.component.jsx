import React from 'react';
import axios from 'axios';
import './geoparsetext.styles.scss';
import ResultsTextMetaDataContainer from '../../components/resultsText-metadata-container/resultsText-metadata-container.component';

class GeoParseComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            backendURL: props.backendURL,
            isLoading: false,
            elapsedTime: 0,
            results: []
        };
        this.timer = null;
    }

    handleInputChange = (event) => {
        this.setState({ text: event.target.value });
    }

    handleSubmit = (event) => {
        event.preventDefault();
    
        this.setState({ isLoading: true, elapsedTime: 0 });
    
        this.timer = setInterval(() => {
            this.setState((prevState) => ({
                elapsedTime: prevState.elapsedTime + 1,
            }));
        }, 1000);
    
        axios.post(`${this.state.backendURL}/geoparse`, { text: this.state.text })
            .then(response => {
                clearInterval(this.timer);
                this.setState({
                    results: response.data,
                    isLoading: false,
                    elapsedTime: 0,
                });
                console.log(response.data);
            })
            .catch(error => {
                clearInterval(this.timer);
                this.setState({ isLoading: false, elapsedTime: 0 });
                console.error(error);
            });
    }    

    render() {
        const { text, isLoading, elapsedTime, results } = this.state;
        const showResults = results.length > 0;

        return (
            <div className="geoparse-container">
                <h2>Geoparse Text</h2>
                <form onSubmit={this.handleSubmit}>
                    <textarea
                        className="geoparse-textarea"
                        value={text}
                        onChange={this.handleInputChange}
                        placeholder="Enter text here to geoparse..."
                    />
                    <div className="geoparse-button-container">
                        <button type="submit" className="geoparse-button" disabled={isLoading}>
                            {isLoading ? `Processing... (Time Elapsed: ${elapsedTime} seconds)` : "Geoparse"}
                        </button>
                    </div>
                </form>
                {showResults && (
                    <div className="resultsText-container">
                        <h1>Results</h1>
                        <div className='resultsText-header-container'>
                            <h3>Key name</h3>
                            <h3>Place Name</h3>
                            <h3>Country</h3>
                            <h3>Region</h3>
                            <h3>Lat</h3>
                            <h3>Lon</h3>
                        </div>
                        {results.map((result, index) => {
                            const geo = result.geo ? result.geo : null;
                            return (
                                <ResultsTextMetaDataContainer
                                    keyName={result.word}
                                    placeName={geo ? geo.place_name : 'N/A'}
                                    country={geo ? geo.country_code3 : 'N/A'}
                                    region={geo ? geo.admin1 : 'N/A'}
                                    lat={geo ? geo.lat : 'N/A'}
                                    lon={geo ? geo.lon : 'N/A'}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}

export default GeoParseComponent;
