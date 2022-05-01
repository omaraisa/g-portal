import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";
import styles from "../sub_components/loading.module.css";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

export default function BufferAnalysis() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const [inputTypeRef, layerSelectorRef, distanceValueRef, distanceFieldRef,measureUnitRef] = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];
  const [state, setState] = useState({
    loading: false,
    allInputsValid: false,
    allFeatures: [],
    fieldsNames: [],
    targetLayer: null,
    manualInput: true,
  });
  const stateRef = useRef();
  stateRef.current = state;
  const [loading, setLoading] = useState(false);

  function analyze(state) {
    setLoading(true)
    checkInputs(state)
      ? runBuffer(state)
      : sendErrorMessage("الرجاء التأكد من جميع المدخلات");
  }

  function handleEmptyResult() {
    sendErrorMessage("لا توجد نتيجة لهذه العملية");
    setLoading(false);
  }

  function checkInputs(state) {
    const distance = state.manualInput
      ? distanceValueRef.current.value
      : distanceFieldRef.current.value;
    const paramsArray = [layerSelectorRef.current.value, distance];
    return paramsArray.every((parameter) =>
      parameter && parameter !== "" ? true : false
    );
  }

  function getResultGraphics(state) {
    return state.targetLayer
      .queryFeatures(GIS.allDataQuery)
      .then(function (result) {
        return result.features.map((feature) => {
          const bufferUnit = measureUnitRef.current.value;
          const bufferDistance = state.manualInput
            ? distanceValueRef.current.value
            : feature.attributes[distanceFieldRef.current.value];
          let bufferGeometry = geometryEngine.geodesicBuffer(
            feature.geometry,
            bufferDistance,
            bufferUnit
          );
          let bufferGraphic = new Graphic({
            geometry: bufferGeometry,
            attributes: feature.attributes,
          });
          return bufferGraphic;
        });
      })
      .catch((error) => {
        sendErrorMessage("تعذر جمع البيانات عن الطبقة المختارة");
        console.log("Query Error", error);
      });
  }
  function runBuffer(state) {
    const resultGraphics = getResultGraphics(state);
    Promise.all([resultGraphics]).then((response) => {
      const resultGraphics = response[0];
      resultGraphics.length
        ? addAnalysisResult({ source: resultGraphics, state: stateRef.current })
        : handleEmptyResult();
    });
  }

  function addAnalysisResult({ source, state }) {
    const fields = state.targetLayer.fields;
    fields.push({
      name: "OBJECTID",
      alias: "OBJECTID",
      type: "oid",
    });

    const fieldInfos = fields.map(field => ({fieldName: field.name}))

    const bufferLayerPopup = {
        title: "الحرم رقم {ObjectID}",
        content: [{
            type: "fields",
            fieldInfos
        }]
    }

    const bufferLayer = new FeatureLayer({
      title: state.targetLayer.title + "_حرم",
      source: source,
      opacity: 0.5,
      popupEnabled: true,
      popupTemplate: bufferLayerPopup,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          outline: {
            color: "#fff",
            width: 1,
          },
        },
      },
      fields,
      geometryType: "polygon",
      spatialReference: state.targetLayer.spatialReference,
    });

    map.layers.add(bufferLayer);
    bufferLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "تحليل الحرم",
        body: `اكتملت عملية التحليل وتمت إضافة الطبقة ${bufferLayer.title}`,
      });
      setLoading(false);
    });
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في إنشاء الحرم",
      body: errorMessage,
    });
  }

  function setLayer(state) {
    const layerIndex = layerSelectorRef.current.value;
    const targetLayer = layers[layerIndex];
    const fieldsNames = targetLayer.fields.map((field) => field.name);
    targetLayer
      .queryFeatures(GIS.allDataQuery)
      .then(function (result) {
        setState({
          ...state,
          targetLayer,
          fieldsNames,
          allFeatures: result.features,
        });
      })
      .catch((error) => {
        sendErrorMessage("تعذر جمع البيانات عن الطبقة المختارة");
        console.log("Query Error", error);
      });
  }

  // useEffect(_=> console.log((state)),[state])

  return (
    <div className="flex-column-container">
      <h3>تحليل الحرم Buffer</h3>

      <label htmlFor="firstLayer">اختر الطبقة</label>
      <select
        id="firstLayer"
        ref={layerSelectorRef}
        className="select"
        onChange={() => setLayer(state)}
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSupportedLayers(layers)}
      </select>

      <div className="flex-row-container">
        <input
          type="checkbox"
          id="inputType"
          ref={inputTypeRef}
          defaultChecked={true}
          className="switch-input"
          onChange={() =>
            setState({ ...state, manualInput: !state.manualInput })
          }
        />
        <label htmlFor="inputType" className="switch-lable"></label>
        <label htmlFor="inputType">إدخال يدوي</label>
      </div>

      {state.manualInput ? (
        <div id="queryInputDiv" className="flex-column-container">
          <label htmlFor="queryInput">أدخل المسافة</label>
          <input
            ref={distanceValueRef}
            type="text"
            id="queryInput"
            className="input-text"
          ></input>
        </div>
      ) : (
        <div id="queryValuesDiv" className="flex-column-container">
          <label htmlFor="queryValues">اختر حقل المسافة</label>
          <select ref={distanceFieldRef} id="queryValues" className="select">
            <option value="" hidden>
              اختر
            </option>
            {state.fieldsNames.map((fieldName, index) => {
              return (
                <option key={index} value={fieldName}>
                  {fieldName}
                </option>
              );
            })}
          </select>
        </div>
      )}

 <label htmlFor="measureUnit">اختر وحدة القياس</label>
      <select defaultValue={"meters"} ref={measureUnitRef} id="measureUnit" className="select">
        <option value="feet">قدم</option>
        <option value="meters">متر</option>
        <option value="kilometers">كيلومتر</option>
        <option value="miles">ميل</option>
      </select>

      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={loading}
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
