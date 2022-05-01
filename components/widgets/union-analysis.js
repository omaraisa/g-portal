import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";
import styles from "../sub_components/loading.module.css";
import UnionAnalysisLayer from "../sub_components/union-analysis-layer";

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
    const allFeatures = getResultGraphics(state);
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

  function getResultGraphics(state) {
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

  const handleLayersNoChange = () => {
    const inputNumberOfLayers = Number(numberOfLayersRef.current.value);
    if(inputNumberOfLayers >=2 && inputNumberOfLayers <=10)
    {
    let newLayers = [];
    const deltaLayersNumber = inputNumberOfLayers - state.layers.length;
    inputNumberOfLayers > state.layers.length
      ? (newLayers = addLayers())
      : (newLayers = dropLayers());

    function addLayers() {
      const tempLayers = [];
      for (let i = 0; i < deltaLayersNumber; i++) {
        const id = Math.floor(new Date().getTime())+Math.floor(Math.random() * 999);
        const newLayer = {
          id: id,
          layer:null,
        }
        tempLayers.push(newLayer);
      }
      return [...state.layers, ...tempLayers];
    }

    function dropLayers() {
      const tempLayers = [...state.layers];
      tempLayers.length = inputNumberOfLayers;
      return tempLayers;
    }

    setState({ ...state, layers: newLayers,allInputsValid:inputsChecker(newLayers) });
  }
  }

  function updateLayers({ state, unionLayerId, mapLayerIndex }) {
    const unionLayers = state.layers.map(input => {
      if(input.id === unionLayerId)
      {
        input.layer = layers[mapLayerIndex]
      }
      return input
    })
    setState({...state, layers:unionLayers,allInputsValid:inputsChecker(unionLayers)})
  }
  function deleteLayer({ state, unionLayerId }) {
    const unionLayers = state.layers.filter((layer) => layer.id !== unionLayerId)
    if(unionLayers.length < 2)
    {
      unionLayers.push({
        id: Math.floor(new Date().getTime())+Math.floor(Math.random() * 999),
        layer:null,
      })
    }
    numberOfLayersRef.current.value = unionLayers.length
    setState({...state, layers:unionLayers,allInputsValid:inputsChecker(unionLayers)})
  }

  function inputsChecker(layers) {
    const allInputsValid = layers.every(input => input.layer? true : false)
    return allInputsValid
  }
  
  // useEffect(_=> console.log((state)),[state])

  return (
    <div className="flex-column-container">
      <h3>تحليل الدمج Union</h3>

      <label htmlFor="numberOfLayers">عدد الطبقات</label>
      <input
        type="number"
        className="input-number"
        id="numberOfLayers"
        defaultValue={2}
        min={2}
        max={10}
        ref={numberOfLayersRef}
        onChange={() => handleLayersNoChange()}
      ></input>

      {state.layers.map((layer, index) => {
        return <UnionAnalysisLayer
          key={layer.id}
          id={layer.id}
          layers={layers}
          updateLayers={({ unionLayerId, mapLayerIndex }) => updateLayers({ state, unionLayerId, mapLayerIndex })}
          deleteLayer={({ unionLayerId }) => deleteLayer({ state, unionLayerId })}
        />;
      })}

      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={!state.allInputsValid || loading? true : false}
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
