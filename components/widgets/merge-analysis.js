import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import * as GIS from "../../modules/gis-module";
import styles from "../sub_components/loading.module.css";
import AnalysisLayer from "../sub_components/analysis-layer";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

export default function MergeAnalysis() {
  const { map, view, layers, sendMessage } = useContext(AppContext);
  const initialId =
    Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999);
  const [state, setState] = useState({
    layers: [
      { id: initialId, layer: null },
      { id: initialId + 1, layer: null },
    ],
    loading: false,
    allInputsValid: false,
  });
  const stateRef = useRef();
  const numberOfLayersRef = useRef();
  stateRef.current = state;
  const [loading, setLoading] = useState(false);

  function analyze(state) {
    setLoading(true);
    const allGeometries = getAllGeometries(state);
    Promise.all(allGeometries).then((response) => {
      const flatAryOfGeometries = response.flat();
      response.length
        ? addAnalysisResult({
            allGeometries: flatAryOfGeometries,
            state: stateRef.current,
          })
        : handleEmptyResult();
    });
  }

  function handleEmptyResult() {
    sendErrorMessage("لا توجد نتيجة لهذه العملية");
    setLoading(false);
  }

  function addAnalysisResult({ allGeometries, state }) {
    let finalGeometry = geometryEngine.union(allGeometries);

    const graphic = new Graphic({
      geometry: finalGeometry,
      attributes: { OBJECTID: 1 },
    });

    const fields = [{
      name: "OBJECTID",
      alias: "OBJECTID",
      type: "oid",
    }]

    const symbol = {
      type: "simple-fill",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      outline: {
        width: 2,
        color: "#fff",
      },
    };

    const renderer = {
      type: "simple",
      symbol,
    };


    const mergedLayer = new FeatureLayer({
      title: `مدموجة ${numberOfLayersRef.current.value} طبقات`,
      source: [graphic],
      objectIdField: "OBJECTID",
      fields,
      renderer,
    });

    map.layers.add(mergedLayer);
    mergedLayer.queryExtent().then(function (result) {
      view.goTo(result.extent);
      sendMessage({
        type: "info",
        title: "تحليل الدمج",
        body: `اكتملت عملية التحليل وتمت إضافة الطبقة ${mergedLayer.title}`,
      });
      setLoading(false);
      setState({ ...state, mergedLayer });
    });
  }

  function getAllGeometries(state) {
    const allGeometries = state.layers.map((input) => {
      return input.layer
        .queryFeatures(GIS.allDataQuery)
        .then((response) => getGeometries(response.features))
        .catch((error) => {
          sendErrorMessage(
            "حدث خطأ أثناء معالجة البيانات الرجاء المحاولة مرة أخرى"
          );
          console.log("Query Error", error);
          return;
        });
    });
    return allGeometries;
  }

  function getGeometries(features) {
    return features.map((feature) => feature.geometry);
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "خطأ في عملية الدمج",
      body: errorMessage,
    });
  }

  const handleLayersNoChange = () => {
    const inputNumberOfLayers = Number(numberOfLayersRef.current.value);
    if (inputNumberOfLayers >= 2 && inputNumberOfLayers <= 10) {
      let newLayers = [];
      const deltaLayersNumber = inputNumberOfLayers - state.layers.length;
      inputNumberOfLayers > state.layers.length
        ? (newLayers = addLayers())
        : (newLayers = dropLayers());

      function addLayers() {
        const tempLayers = [];
        for (let i = 0; i < deltaLayersNumber; i++) {
          const id =
            Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999);
          const newLayer = {
            id: id,
            layer: null,
          };
          tempLayers.push(newLayer);
        }
        return [...state.layers, ...tempLayers];
      }

      function dropLayers() {
        const tempLayers = [...state.layers];
        tempLayers.length = inputNumberOfLayers;
        return tempLayers;
      }

      setState({
        ...state,
        layers: newLayers,
        allInputsValid: inputsChecker(newLayers),
      });
    }
  };

  function updateLayers({ state, id, mapLayerIndex }) {
    const mergedLayers = state.layers.map((input) => {
      if (input.id === id) {
        input.layer = layers[mapLayerIndex];
      }
      return input;
    });
    setState({
      ...state,
      layers: mergedLayers,
      allInputsValid: inputsChecker(mergedLayers),
    });
  }
  function deleteLayer({ state, id }) {
    const mergedLayers = state.layers.filter(
      (layer) => layer.id !== id
    );
    if (mergedLayers.length < 2) {
      mergedLayers.push({
        id: Math.floor(new Date().getTime()) + Math.floor(Math.random() * 999),
        layer: null,
      });
    }
    numberOfLayersRef.current.value = mergedLayers.length;
    setState({
      ...state,
      layers: mergedLayers,
      allInputsValid: inputsChecker(mergedLayers),
    });
  }

  function inputsChecker(layers) {
    const allInputsValid = layers.every((input) =>
      input.layer ? true : false
    );
    return allInputsValid;
  }

  // useEffect(_=> console.log((state)),[state])

  return (
    <div className="flex-column-container">
      <h3>تحليل الدمج Merge</h3>

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
        return (
          <AnalysisLayer
            key={layer.id}
            id={layer.id}
            layers={layers}
            updateLayers={({ id, mapLayerIndex }) =>
              updateLayers({ state, id, mapLayerIndex })
            }
            deleteLayer={({ id }) =>
              deleteLayer({ state, id })
            }
          />
        );
      })}

      <button
        className="button primaryBtn"
        onClick={() => analyze(state)}
        disabled={!state.allInputsValid || loading ? true : false}
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
