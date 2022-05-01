// import styles from './bookmark.module.css'
import React, { useState, useRef } from "react";
const supportedLayerTypes = ["csv", "feature", "geojson"]

export default function UnionAnalysisLayer({
  id,
  layers,
  updateLayers,
  deleteLayer,
}) {
  const styles = {
    container: {
      display: "flex",
      flexFlow: "row nowrap",
      alignItems: "center",
      widght: "100%",
      gap: ".5rem"
    },
    deleteBtn: {
      fontSize: "2rem",
      flex: 0.1,
      cursor:"pointer"
    },
    layerSelect: {
      flex: 0.9,
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
          layers.map((layer, index) => {
            if (supportedLayerTypes.includes(layer.type) && layer.geometryType ==="polygon") {
            return (
              <option key={layer.id} value={index}>
                {layer.title}
              </option>
            );
            }
          })
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
