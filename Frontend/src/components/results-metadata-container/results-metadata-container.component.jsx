import React from 'react';
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa"; // Include the icons package
import './results-metadata-container.styles.scss';

const ResultsMetaDataContainer = ({ text, coordinates, placeName, country, region, lat, lon, rating, distance }) => {
    let isSuccessful = false;
    
    if (rating === 0) {
        isSuccessful = false;
    } else if (rating === 1) {
        isSuccessful = true;
    } else if (rating === 2) {
        isSuccessful = false;
    }
    
    return (
        <div className='results-metadata-container'>
            <p className='results-grid-content'>{text}</p>
            <p className='results-grid-content'>{coordinates[0].toFixed(4) + ",\n" + coordinates[1].toFixed(4)}</p>
            <p className='results-grid-content'>{placeName}</p>
            <p className='results-grid-content'>{country}</p>
            <p className='results-grid-content'>{region}</p>
            <p className='results-grid-content'>{isNaN(parseFloat(lat)) ? lat : parseFloat(lat).toFixed(4)}</p>
            <p className='results-grid-content'>{isNaN(parseFloat(lon)) ? lon : parseFloat(lon).toFixed(4)}</p>
            {/*
            <p className='results-grid-content'>
                {difference === null || difference[0] === null || difference[1] === null || isNaN(parseFloat(difference[0])) || isNaN(parseFloat(difference[1])) ? "N/A" : parseFloat(difference[0]).toFixed(4) + ", " + parseFloat(difference[1]).toFixed(4)}
            </p>
            */}

            <p className='results-grid-content'>{isNaN(parseFloat(distance)) ? distance : parseFloat(distance).toFixed(2)+"m"}</p>
            <p className='results-grid-content'>{isSuccessful ? <FaCheckCircle color="green" /> : <FaTimesCircle color="red" />}</p>
        </div>
    )
}

export default ResultsMetaDataContainer;
