import React from 'react';

function Loader({ message = 'Loading...' }) {
  return <div className="loader">{message}</div>;
}

export default Loader;
