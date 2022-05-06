// import styles from './bookmark.module.css'
import React, { useState, useRef } from "react";
import * as GIS from "../../modules/gis-module";

export default function AnalysisLayer({
  id,
  layers,
  updateLayers,
  deleteLayer,
  geometry
}) {
  const styles = {
    container: {
      display: "flex",
      flexFlow: "row nowrap",
      alignItems: "center",
      width: "100%",
      gap: ".5rem"
    },
    deleteBtn: {
      fontSize: "2rem",
      flex: 0.1,
      cursor:"pointer"
    },
    layerSelect: {
      flex: 0.9,
      maxWidth: "90%"
    },
  };

  const layerRef = useRef();
  
  return (
    <div style={styles.container}>     

      <select
        className="select"
        ref={layerRef}
        style={styles.layerSelect}
        onChange={() => updateLayers({id,mapLayerIndex:layerRef.current.value})}
      >
        <option value="" hidden>
          اختر
        </option>
        {
          GIS.listSupportedLayers(layers,geometry)
        }
      </select>
      <i
        className={`esri-icon-close-circled`}
        style={styles.deleteBtn}
        onClick={() => deleteLayer({id})}
      ></i>
    </div>
  );
}
