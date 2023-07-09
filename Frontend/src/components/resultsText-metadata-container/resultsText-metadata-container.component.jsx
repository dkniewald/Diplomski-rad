import React from 'react';
import './resultsText-metadata-container.styles.scss';

const ResultsTextMetaDataContainer = ({ keyName, placeName, country, region, lat, lon}) => {
    return (
        <div className='resultsText-metadata-container'>
            <p className='resultsText-grid-content'>{keyName}</p>
            <p className='resultsText-grid-content'>{placeName}</p>
            <p className='resultsText-grid-content'>{country}</p>
            <p className='resultsText-grid-content'>{region}</p>
            <p className='resultsText-grid-content'>{isNaN(parseFloat(lat)) ? lat : parseFloat(lat).toFixed(4)}</p>
            <p className='resultsText-grid-content'>{isNaN(parseFloat(lon)) ? lon : parseFloat(lon).toFixed(4)}</p>
        </div>
    )
}

export default ResultsTextMetaDataContainer;
