import React from 'react';

const InfoWindow = ({ planetInfo }) => {
    return (
        <div className="info-window">
            <h2>{planetInfo.name}</h2>
            <p>{planetInfo.orbitInfo}</p>
        </div>
    );
};

export default InfoWindow;