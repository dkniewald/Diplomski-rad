import React from 'react';
import axios from 'axios';
import './placelookup.styles.scss';
import ResultsLookUpMetaDataContainer from '../../components/resultslookup-metadata-container/resultslookup-metadata-container.component';

class PlaceLookupComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            place: '',
            backendURL: props.backendURL,
            isLoading: false,
            elapsedTime: 0,
            results: []
        };
        this.timer = null;
    }

    handleInputChange = (event) => {
        this.setState({ place: event.target.value });
    }

    handleSubmit = (event) => {
        event.preventDefault();

        this.setState({ isLoading: true, elapsedTime: 0 });

        this.timer = setInterval(() => {
            this.setState((prevState) => ({
                elapsedTime: prevState.elapsedTime + 1,
            }));
        }, 1000);

        axios.post(`${this.state.backendURL}/es_search`, { query: this.state.place })
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
        const { place, isLoading, elapsedTime, results } = this.state;
        const showResults = results.length > 0;

        return (
            <div className="placeLookup-container">
                <h2>Place Lookup</h2>
                <form onSubmit={this.handleSubmit}>
                    <input
                        type="text"
                        className="placeLookup-input"
                        value={place}
                        onChange={this.handleInputChange}
                        placeholder="Enter a place name..."
                    />
                    <div className="placeLookup-button-container">
                        <button type="submit" className="placeLookup-button" disabled={isLoading}>
                            {isLoading ? `Processing... (Time Elapsed: ${elapsedTime} seconds)` : "Search"}
                        </button>
                    </div>
                </form>
                {showResults && (
                    <div className="resultsText1-container">
                        <h1>Results</h1>
                        <div className='resultsText1-header-container'>
                            <h3>Place Name</h3>
                            <h3>Country</h3>
                            <h3>Region</h3>
                            <h3>Lat</h3>
                            <h3>Lon</h3>
                        </div>
                        {results.map((result) => {
                            const data = result._source; // Adjust this based on your actual data structure
                            let lat, lon;
                            if (data.coordinates) {
                                const coordsArray = data.coordinates.split(',');
                                lat = parseFloat(coordsArray[0]); // 44.38028
                                lon = parseFloat(coordsArray[1]); // 14.79028
                            } else {
                                lat = 'N/A';
                                lon = 'N/A';
                            }
                            return (
                                <ResultsLookUpMetaDataContainer
                                    placeName={data ? data.name : 'N/A'}
                                    country={data ? data.country_code3 : 'N/A'}
                                    region={data && data.admin1_name ? data.admin1_name : 'N/A'}
                                    lat={lat}
                                    lon={lon}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}

export default PlaceLookupComponent;
