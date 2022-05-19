import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";

export default function SaveMap() {
  const [fileNameRef] = [useRef(),];
  const [state, setState] = useState({
    fileName: "",
  });
  const { map, view, layers, sendMessage, mapDefinition } =
    useContext(AppContext);

  function saveMap(state) {
    mapDefinition.extent = view.extent;
    mapDefinition.basemap = map.basemap;
    mapDefinition.Source= "GPortal Map"
    mapDefinition.Developer="gis-gate.com"
    mapDefinition.CopyRights= "GPortal"
    mapDefinition.Usage="This file has been exported from a Gportal Map. It can be used by importing it to the platform"
    const layerSources = generateLayerSources();

    Promise.all(layerSources).then((response) => {
      mapDefinition.layerSources = response;
      downloadMapFile(JSON.stringify(mapDefinition), state);
    });
  }

  function downloadMapFile(mapDefinition, state) {
    const fileName = state.fileName;
    const blob = new Blob([mapDefinition], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".gpmap";
    link.key =
      Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    fileNameRef.current.value = "";
    setState({...state,fileName:""})
  }

  function generateLayerSources() {
    return layers.map(async (layer,index) => {
      const url =
        layer.type === "feature" ? layer.url + "/" + layer.layerId : layer.url;
      const layerSource = {
        id: layer.id,
        title: layer.title,
        renderer: layer.renderer,
        geometryType: layer.geometryType,
        popupEnabled: layer.popupEnabled,
        popupTemplate: layer.popupTemplate,
        opacity: layer.opacity,
        fields: layer.fields,
        legendEnabled: layer.legendEnabled,
        labelsVisible: layer.labelsVisible,
        labelingInfo: layer.labelingInfo,
        type: layer.type,
        url,index,
      };
      if (!layer.url) {
        layerSource.layerFeatures = await prepareLayerFeatures(layer);
        layerSource.sourceIncluded = true;
      }
      return layerSource;
    });
  }

  async function prepareLayerFeatures(layer) {
    return new Promise((resolve, reject) => {
      layer.type === "graphics"
      ? handleGraphicsLayer() 
      : handleFeatureLayer() 
      
      function handleGraphicsLayer() {
        resolve(layer.graphics.items)
      }
      function handleFeatureLayer() {
        layer.queryFeatures(GIS.allDataQuery).then(function (result) {
          if (result.features.length) {
            const layerFeatures = result.features.map((feature) => {
              const graphic = new Graphic({
                geometry: feature.geometry,
                attributes: feature.attributes,
              });
              return graphic;
            });
            resolve(layerFeatures);
          } else reject([]);
        });

      }
    }).catch((error) => {
      console.log(error);
      return [];
    });
  }

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>حفظ الخريطة</h3>
      <label htmlFor="textInput" className="textInput">
        <input
          type="text"
          className="input-text"
          id="textInput"
          placeholder="&nbsp;"
          ref={fileNameRef}
          onChange={(event) =>
            setState({ ...state, fileName: event.target.value })
          }
        ></input>
        <span className="label">اسم الملف</span>
        <span className="focus-bg"></span>
      </label>
      <button
        className="button successBtn"
        disabled={state.fileName === ""}
        onClick={() => saveMap(state)}
      >
        حفظ ملف الخريطة
      </button>
    </div>
  );
}
