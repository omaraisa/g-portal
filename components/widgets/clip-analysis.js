import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";
import styles from "../sub_components/loading.module.css";
import AnalysisLayer from "../sub_components/analysis-layer";

export default function ClipAnalysis() {
  const { map, layers, sendMessage } = useContext(AppContext);
  const initialId =
    Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999);
  const [state, setState] = useState({
    layers: [{ id: initialId, layer: null }],
    clipGeometry: null,
    allInputsValid: false,
    loading: false,
  });
  const numberOfLayersRef = useRef();
  const stateRef = useRef();
  stateRef.current = state;
  const [loading, setLoading] = useState(false);

  function setClipLayer(state, event) {
    try {
      const layerIndex = event.target.value;
      const selectedLayer = layers[layerIndex];
      selectedLayer.queryFeatures(GIS.allDataQuery).then(function (result) {
        const allFeaturesGeometries = result.features.map(
          (feature) => feature.geometry
        );
        const clipGeometry = geometryEngine.union(allFeaturesGeometries);
        setState({ ...state, clipGeometry });
      });
    } catch (error) {
      sendErrorMessage("فشل الحصول على بيانات طبقة الاقتطاع");
      console.log(error);
    }
  }

  function analyze(state) {
    setLoading(true);
    const resultLayers = runClipAnalysis(state);
    Promise.all(resultLayers).then((response) => {
      response.length
        ? addLayersToMap(response)
        : handleEmptyResult();
    });
  }

  function addLayersToMap(resultLayers) {
    try {
      map.layers.addMany(resultLayers)
      sendMessage({
        type: "info",
        title: "تحليل الاقتطاع",
        body: `اكتملت عملية التحليل وتمت إضافة الطبقات الى الخريطة`,
      });
      
    } catch (error) {
      sendErrorMessage("فشلت عملية إضافة النتيجة الى الخريطة");
      console.log(error)
    }
    setLoading(false);
  }
  
  function handleEmptyResult() {
    sendErrorMessage("لا توجد نتيجة لهذه العملية");
    setLoading(false);
  }

  function runClipAnalysis (state) {
    const clippedLayers = state.layers.map(layer => {
     const graphics = layer.features.map(feature => {
       const clippedGeometry =  geometryEngine.intersect(feature.geometry, state.clipGeometry);
       if(clippedGeometry)
       {
          return new Graphic({
            geometry: clippedGeometry,
            attributes: feature.attributes,
             });
            }
          })
          
          const revisedGraphics = graphics.filter(graphic => graphic !== undefined)
      
      if(!revisedGraphics.length)
      {
        sendErrorMessage(`طبقة ${layer.layer.title} لم تعط أي نتيجة`)
        return
      }
      
      const fields = layer.fields
        const symbol = GIS.symbols[layer.layer.geometryType];
        symbol.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
        const renderer = {
          type: "simple",
          symbol,
        };
    
        const fieldInfos = fields.map((field) => ({ fieldName: field.name }));
    
        let clippedLayerPopup = {
          title: " المعلم رقم {OBJECTID}",
          content: [
            {
              type: "fields",
              fieldInfos,
            },
          ],
        };
    
        const clippedLayer =  new FeatureLayer({
          title: `${layer.layer.title}_طبقة مقتطعة`,
          source: revisedGraphics,
          popupEnabled: true,
          popupTemplate: clippedLayerPopup,
          outFields: ["*"],
          objectIdField: "OBJECTID",
          spatialReference: layer.layer.spatialReference,
          fields,
          renderer,
        });
        // map.layers.add(clippedLayer)
        return clippedLayer
      })
      return clippedLayers
  }

function getLayerFeatures (id) {
  const updatedLayers = state.layers.map((layerObject) => {
    if (layerObject.id === id) {
      layerObject.layer.queryFeatures(GIS.allDataQuery).then((result) => {
        if (!result.features.length) {
          sendErrorMessage("لا توجد بيانات في هذه الطبقة");
          return;
        }
        layerObject.features = result.features;
        layerObject.fields = [...layerObject.layer.fields,{name:"OBJECTID",type:"oid"}];
      });
    }
    return layerObject;
  });
  setState({ ...state, layers: updatedLayers ,allInputsValid: GIS.inputsChecker(state.layers)});
}

function sendErrorMessage(errorMessage) {
  sendMessage({
    type: "error",
    title: "خطأ في عملية الاتحاد",
    body: errorMessage,
  });
}

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>تحليل الاقتطاع Clip</h3>

      <label htmlFor="numberOfLayers">عدد الطبقات</label>
      <input
        type="number"
        className="input-number"
        id="numberOfLayers"
        defaultValue={1}
        min={1}
        max={10}
        ref={numberOfLayersRef}
        onChange={() =>
          GIS.handleLayersNumChange({
            state,
            inputNumberOfLayers: numberOfLayersRef.current.value,
            setState,
          })
        }
      ></input>

      {state.layers.map((layer, index) => {
        return (
          <AnalysisLayer
            key={layer.id}
            id={layer.id}
            layers={layers}
            updateLayers={({ id, mapLayerIndex }) => {
              GIS.updateLayers({ state, setState, layers, id, mapLayerIndex })
              getLayerFeatures(id)
            }
            }
            deleteLayer={({ id }) =>
              GIS.deleteLayer({ state, setState, numberOfLayersRef, id })
            }
          />
        );
      })}

      <label htmlFor="clipLayer">طبقة الاقتطاع</label>
      <select
        id="clipLayer"
        className="select"
        onChange={(event) => setClipLayer(state, event)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers, "polygon")}
      </select>
      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={!state.allInputsValid || !state.clipGeometry  || loading} 
      >
        &nbsp; بدء التحليل
      </button>
      {loading && (
        <div className={styles.loadingDiv} style={{ height: "3rem" }}>
          <i
            className={`esri-icon-loading-indicator  ${styles.loadingIcon}`}
          ></i>
        </div>
      )}
    </div>
  );
}
