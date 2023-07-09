import React from 'react';
import './resultslookup-metadata-container.styles.scss';

const ResultsLookUpMetaDataContainer = ({placeName, country, region, lat, lon}) => {
    return (
        <div className='resultslookup-metadata-container'>
            <p className='resultslookup-grid-content'>{placeName}</p>
            <p className='resultslookup-grid-content'>{country}</p>
            <p className='resultslookup-grid-content'>{region}</p>
            <p className='resultslookup-grid-content'>{isNaN(parseFloat(lat)) ? lat : parseFloat(lat).toFixed(4)}</p>
            <p className='resultslookup-grid-content'>{isNaN(parseFloat(lon)) ? lon : parseFloat(lon).toFixed(4)}</p>
        </div>
    )
}

export default ResultsLookUpMetaDataContainer;
