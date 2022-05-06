import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from '../../modules/gis-module'
import styles from "../sub_components/loading.module.css";


export default function IntersectionAnalysis() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const [state, setState] = useState({
    layer1: null,
    layer2: null,
    geometryType: null,
    loading:false
  });
  const stateRef = useRef()
  stateRef.current = state;
  const [loading, setLoading] = useState(false)

  function setLayer(state,event,layerOrder) {
    try {
      const layerIndex = event.target.value;
      const selectedLayer = layers[layerIndex];
      let selectedLayerFields = selectedLayer.fields;
      if(layerOrder>1)
      {
        const antiDuplicateFields =  selectedLayerFields.map(field => {
          field.name = field.name+layerOrder
          return field
        })
        selectedLayerFields = [...antiDuplicateFields]
      }
  
      selectedLayer.queryFeatures(GIS.allDataQuery).then(function (result) {
        const newState = {...state,}
        newState[`layer${layerOrder}`] = selectedLayer
        newState[`layer${layerOrder}Fields`] = selectedLayerFields
        newState[`layer${layerOrder}Features`] = result.features
        setState(newState);
      });
      
    } catch (error) {
      sendErrorMessage('فشل الحصول على بيانات الطبقة')
      console.log(error)
    }
  }

  function analyze(state) {    
    setLoading(true)
    const resultGraphics = getResultGraphics(state);
    Promise.all(resultGraphics).then((response) => {
      response.length
        ? addAnalysisResult({ response, state: stateRef.current })
        : handleEmptyResult()
        
  });
}

function handleEmptyResult() {
  sendErrorMessage("لا توجد نتيجة لهذه العملية")
  setLoading(false)
  }

  function addAnalysisResult({ response, state}) {
    const fields = [
      ...state.layer1Fields,
      ...state.layer2Fields,
      {
        name: "OBJECTID",
        alias: "OBJECTID",
        type: "oid",
      },
    ];

    const symbol = GIS.symbols[stateRef.current.geometryType];
    symbol.color = "#" + Math.floor(Math.random() * 16777215).toString(16)
    const renderer = {
      type: "simple",
      symbol,
    };

    const fieldInfos = fields.map(field => ({fieldName: field.name}))

  let intersectionLayerPopup = {
      title: "التقاطع رقم {ObjectID}",
      content: [{
          type: "fields",
          fieldInfos
      }]
  }

    const intersectionLayer = new FeatureLayer({
      title: `${state.layer1.title}_${state.layer2.title}_تقاطع`,
      source: response,
      popupEnabled: true,
      popupTemplate: intersectionLayerPopup,
      outFields: ["*"],
      objectIdField : "OBJECTID",
      geometryType : stateRef.current.geometryType,
      spatialReference: state.layer1.spatialReference,
      fields,renderer
    });
    
    map.layers.add(intersectionLayer);
    intersectionLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "تحليل التقاطع",
        body: `اكتملت عملية التحليل وتمت إضافة الطبقة ${state.layer1.title}_${state.layer2.title}_تقاطع`,
      });
      setLoading(false)
      setState({...state,intersectionLayer});
    });
  }

  function getResultGraphics(state) {
    const resultGraphics = [];
    let geometryType;    
    let objectID = 0;

    try {
    state.layer1Features.forEach((firstFeature) => {
      state.layer2Features.forEach((secondFeature) => {
        let intersectionGeom = geometryEngine.intersect(
          firstFeature.geometry,
          secondFeature.geometry
        );

        if (intersectionGeom) {
          const attributes = {...firstFeature.attributes};
          for (const [key, value] of Object.entries(secondFeature.attributes)) {
            attributes[key + "2"] = value;
          }
          attributes["OBJECTID"] = objectID;
          objectID++;
          
          const intersectionGraphic = new Graphic({
            geometry: intersectionGeom,
            attributes: attributes,
          });
          resultGraphics.push(intersectionGraphic);
          geometryType = intersectionGeom.type;
        }
      });
    });
  } catch (error) {
    sendErrorMessage('فشلت العملية، هنالك مشكلة في البيانات المدخلة')
    console.log(error)
  }
    setState({...state,geometryType})
    return resultGraphics
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية التقاطع",
      body: errorMessage,
    });
  }
  
  return (
    <div className="flex-column-container">
      <h3>تحليل التقاطع Intersection</h3>

      <label htmlFor="firstLayer">الطبقة الأولى</label>
      <select
        id="firstLayer"
        className="select"
        onChange={(event) => setLayer(state,event,1)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers)}
      </select>

      <label htmlFor="secondLayer">الطبقة الثانية</label>
      <select
        id="secondLayer"
        className="select"
        onChange={(event) => setLayer(state,event,2)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers)}
      </select>
      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={state.layer1 && state.layer2 && !loading ? false : true}
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
