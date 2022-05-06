import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";
import styles from "../sub_components/loading.module.css";
import AnalysisLayer from "../sub_components/analysis-layer";

export default function UnionAnalysis() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const initialId = Math.floor(new Date().getTime())+Math.floor(Math.random() * 999)
  const [state, setState] = useState({
    layers: [{id:initialId,layer:null},{id:initialId+1,layer:null}],
    loading: false,
    allInputsValid:false,
  });
  const stateRef = useRef();
  const numberOfLayersRef = useRef();
  stateRef.current = state;
  const [loading, setLoading] = useState(false);

  function analyze(state) {
    setLoading(true);
    const allFeatures = getAllFeatures(state);
    Promise.all(allFeatures).then((response) => {
      const flatAryOfFeatures = response.flat()
      response.length
        ? addAnalysisResult({ allFeatures: flatAryOfFeatures, state: stateRef.current })
        : handleEmptyResult();
    });
  }

  function handleEmptyResult() {
    sendErrorMessage("لا توجد نتيجة لهذه العملية");
    setLoading(false);
  }

  function addAnalysisResult({ allFeatures, state }) {
    let objectID = 0
   const graphics =  allFeatures.map((feature) => {
     
        const attributes = feature.attributes
        attributes["OBJECTID"] = objectID;
        objectID++;
        
        const graphic = new Graphic({
          geometry: feature.geometry,
          attributes: attributes,
        });
        return graphic
      
    });

    const combinedFields = state.layers.map(input=> input.layer.fields)
    const fields = combinedFields.flat().concat({
      name: "OBJECTID",
      alias: "OBJECTID",
      type: "oid",
    })

    const symbol = {
      type: "simple-fill",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      outline: {
        width: 2,
        color: "#fff",
      },
    }
    
    const renderer = {
      type: "simple",
      symbol,
    };

    const fieldInfos = fields.map(field => ({fieldName: field.name}))

  let unionLayerPopup = {
      title: "العنصر رقم {ObjectID}",
      content: [{
          type: "fields",
          fieldInfos
      }]
  }

    const unionLayer = new FeatureLayer({
      title: `اتحاد ${numberOfLayersRef.current.value} طبقات`,
      source: graphics,
      popupEnabled: true,
      popupTemplate: unionLayerPopup,
      outFields: ["*"],
      objectIdField : "OBJECTID",
      fields,renderer
    });

    map.layers.add(unionLayer);
    unionLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "تحليل التقاطع",
        body: `اكتملت عملية التحليل وتمت إضافة الطبقة ${unionLayer.title}`,
      });
      setLoading(false)
      setState({...state,unionLayer});
    });


  }

  function getAllFeatures(state) {
    const allFeatures = state.layers.map(input=>{
      return input.layer.queryFeatures(GIS.allDataQuery).then(response=> response.features).catch((error) => {
        sendErrorMessage("حدث خطأ أثناء معالجة البيانات الرجاء المحاولة مرة أخرى");
        console.log("Query Error", error);
        return;
      });
    })
    return allFeatures
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية الاتحاد",
      body: errorMessage,
    });
  }
  
  // useEffect(_=> console.log((state)),[state])

  return (
    <div className="flex-column-container">
      <h3>تحليل الاتحاد Union</h3>

      <label htmlFor="numberOfLayers">عدد الطبقات</label>
      <input
        type="number"
        className="input-number"
        id="numberOfLayers"
        defaultValue={2}
        min={2}
        max={10}
        ref={numberOfLayersRef}
        onChange={() =>
          GIS.handleLayersNumChange({
            state,
            inputNumberOfLayers: numberOfLayersRef.current.value,
            minNumber:2,
            setState,
          })
        }
      ></input>

      {state.layers.map((layer, index) => {
        return <AnalysisLayer
          key={layer.id}
          id={layer.id}
          layers={layers}
          geometry="polygon"
          updateLayers={({ id, mapLayerIndex }) =>
              GIS.updateLayers({ state, setState, layers, id, mapLayerIndex })}
              deleteLayer={({ id }) => GIS.deleteLayer({ state, setState,numberOfLayersRef, id })}
        />;
      })}

      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={!state.allInputsValid || loading}
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
