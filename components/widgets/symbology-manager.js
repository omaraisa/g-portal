import React, { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../../pages";
import * as GIS from "../../modules/gis-module";
import Slider from "@arcgis/core/widgets/Slider";

// import typeRendererCreator from "@arcgis/core/"
const SimpleRendererOptoins = React.lazy(() =>
  import("../sub_components/simple-renderer-options")
);
const UniqueValuesRendererOptions = React.lazy(() =>
  import("../sub_components/unique-renderer-options")
);
const ColorRendererOptions = React.lazy(() =>
  import("../sub_components/color-renderer-options")
);
const SizeRendererOptions = React.lazy(() =>
  import("../sub_components/size-renderer-options")
);
const HeatMapRendererOptions = React.lazy(() =>
  import("../sub_components/heatmap-renderer-options")
);

let transparencySlider

const rendererOptions = {
  simple: SimpleRendererOptoins,
  unique: UniqueValuesRendererOptions,
  color: ColorRendererOptions,
  size: SizeRendererOptions,
  heatmap: HeatMapRendererOptions,
};

const symbologyTypeGetter = {
  string: "textual",
  date: "textual",
  oid: "numerical",
  integer: "numerical",
  double: "numerical",
};
const textualRenderers = [{ unique: "تمثيل فريد" }];
const numericalRenderers = [
  { color: "تمثيل باللون" },
  { size: "تمثيل بالحجم" },
  { unique: "تمثيل فريد" },
];
const numericalPointRenderers = [
  { color: "تمثيل باللون" },
  { size: "تمثيل بالحجم" },
  { heatmap: "تمثيل حراري" },
  { unique: "تمثيل فريد" },
];
export default function SymbologyManager() {
  const { map, view, layers, targetLayers, updateTargetLayers, sendMessage } =
    useContext(AppContext);
  const [layerSelectorRef, fieldSelectorRef, legendVisibilityRef,rendererTypeRef,transparencySliderDiv] = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];
  const [state, setState] = useState({
    layersSymbology: [],
    targetLayer: {},
    currentSymbology: {
      layerID: "",
      fields: [],
      symbologyField: "",
      renderers: {},
      numericalSymbology: true,
      opacity: 1,
    },
  });
  const stateRef = useRef();
  stateRef.current = state;

  useEffect(() => {
    
    const targetLayer = targetLayers.symbologyTargetLayer;
    if (targetLayer) {
      try {
        const previousLayerSymbology = { ...state.currentSymbology };
        state.layersSymbology.find(
          (symbology) => symbology.layerID === targetLayer.id
          )
          ? setTargetLayer(targetLayer, previousLayerSymbology, state)
          : addNewSymbology(targetLayer, previousLayerSymbology, state);
          layerSelectorRef.current.value = targetLayer.id;
          rendererTypeRef.current.value = ""
      } catch (error) {
        sendErrorMessage(
          "عفواً حدث خطأ أثناء معالجة معلومات الطبقة، الرجاء المحاولة مرة أخرى"
        );
        console.log(error);
      }
    }
  }, [targetLayers.symbologyTargetLayer]);

  useEffect(() => {
    if(transparencySliderDiv){  
      transparencySlider = new Slider({
        container: transparencySliderDiv.current,
        min: 0,
        max: 100,
        values: [0],
        steps: 1,
        snapOnClickEnabled: false,
        visibleElements: {
          labels: true,
          rangeLabels: true,
        },
        labelFormatFunction: (value, type) => {
          return `${value.toString()}%`;
        },
      });    
    transparencySlider.render();
    if(state.targetLayer)
    transparencySlider.on("thumb-drag", (event) =>
     {
       try {
         const state = stateRef.current
         const opacity = 1 - (event.value/100) 
        state.targetLayer.opacity = opacity
        if(event.state === "stop")
         setState({...state,currentSymbology:{...state.currentSymbology,opacity}})
       } catch (error) {
         sendErrorMessage("حدث خطأ أثناء تغيير الشفافية، رجاءً تأكد أن الطبقة تم تحميلها بصورة كاملة")
       }
     }
    );
    }
    return () => {
      updateTargetLayers({
        symbologyTargetLayer: {},
      })
  }
  }, []);

  
  function getUpdatedLayersSymbology(previousLayerSymbology, state) {
    const currentLayersIDs = layers.map((layer) => layer.id);
    const layersSymbology = state.layersSymbology.map((symbology) => {
      if (symbology.layerID === state.targetLayer.id)
        symbology = { ...previousLayerSymbology };
      return symbology;
    });
    return layersSymbology.filter((symbology) =>
      currentLayersIDs.includes(symbology.layerID)
    );
  }

  function setTargetLayer(targetLayer, previousLayerSymbology, state) {
    const layersSymbology = getUpdatedLayersSymbology(
      previousLayerSymbology,
      state
    );
    const currentSymbology = state.layersSymbology.find(
      (symbology) => symbology.layerID === targetLayer.id
    );

    transparencySlider.values[0] = currentSymbology.opacity
    const transparency = (1 - currentSymbology.opacity) * 100
    transparencySlider.tickConfigs = [{
      mode: "count",
      values: [currentSymbology.opacity]
    }];
    transparencySlider.labels.values[0] = Math.floor(transparency).toString()
    transparencySlider.renderNow()

    setState({
      ...state,
      layersSymbology,
      currentSymbology,
      targetLayer,
    });
  }

  function addNewSymbology(targetLayer, previousLayerSymbology, state) {
    const fields = 
    targetLayer.fields?
    targetLayer.fields.map((field) => ({
      name: field.name,
      type: field.type,
    }))
    : []

    const newLayerSymbology = {
      layerID: targetLayer.id,
      fields,
      symbologyField: "",
      renderers: {},
      numericalSymbology: true,
    };

    const updatedLayersSymbology = getUpdatedLayersSymbology(
      previousLayerSymbology,
      state
    );
    const layersSymbology = [...updatedLayersSymbology, newLayerSymbology];

    transparencySlider.values[0] = 0
    transparencySlider.labels.values[0] = "0"
    transparencySlider.renderNow()
    
    setState({
      ...state,
      targetLayer,
      layersSymbology,
      currentSymbology: { ...newLayerSymbology },
    });
  }

  
  function updateSymbologyProps({
    property,
    newValue,
    state = stateRef.current,
  }) {
    try {
      const currentSymbology = { ...state.currentSymbology };
      const stateSymbology = {
        legendVisible: () => updateLegendVisible(newValue),
        symbologyField: () => updateSymbologyField(newValue),
        rendererType: () => updateRendererType(newValue),
      };

      function updateLegendVisible(status) {
        state.targetLayer.legendEnabled = status;
        currentSymbology.legendVisible = status;
        return currentSymbology;
      }

      function updateSymbologyField(newValue) {
        currentSymbology.symbologyField = newValue;
        const fieldType = currentSymbology.fields.find(
          (field) => field.name === newValue
        ).type;
        const numericalSymbology =
          symbologyTypeGetter[fieldType] === "numerical" ? true : false;
        currentSymbology.numericalSymbology = numericalSymbology;
        return currentSymbology;
      }

      function updateRendererType(renderer) {
        currentSymbology.rendererType = renderer;
        return currentSymbology;
      }

      const newSymbology = stateSymbology[property]();
      setState({ ...state, currentSymbology: newSymbology });
    } catch (error) {
      sendErrorMessage(
        "عفواً فشلت عملية تعديل خصائص الطبقة الرجاء المحاولة مرة أخرى"
      );
      console.log(error);
    }
  }

  function updateRenderers(renderer) {
    const rendererType = stateRef.current.currentSymbology.rendererType
    const currentSymbology = {...stateRef.current.currentSymbology}
    currentSymbology.renderers[rendererType] = renderer
    setState({...stateRef.current,currentSymbology})
  }

  function showRendererOptions() {
    if (rendererOptions[state.currentSymbology.rendererType]) {
      const CurrentRenderer =
        rendererOptions[state.currentSymbology.rendererType];
      return (
        <CurrentRenderer
          updateRenderers={updateRenderers}
          view={view}
          map={map}
          {...state}
        />
      );
    }
  }

  function sendErrorMessage(errorMessage) {
    sendMessage({
      type: "error",
      title: "مدير التمثيل",
      body: errorMessage,
    });
  }

  // useEffect(() => console.log(state), [state]);

  return (
    <div className="flex-column-container">
      <h3>مدير التمثيل Symbology Manager</h3>

      <div
        className="flex-column-container"
        style={{ border: "solid 1px #e7e7e7", padding: "1rem" }}
      >
        <label htmlFor="targetLayer">اختر الطبقة</label>
        <select
          id="targetLayer"
          className="select"
          ref={layerSelectorRef}
          onChange={(event) =>
            updateTargetLayers({
              symbologyTargetLayer: map.findLayerById(event.target.value),
            })
          }
        >
          <option value="" hidden>
            اختر
          </option>
          {layers.map((layer) => {
            if (GIS.supportedLayerTypes.includes(layer.type)) {
              return (
                <option key={layer.id} value={layer.id}>
                  {layer.title}
                </option>
              );
            }
          })}
        </select>

        <label htmlFor="fieldSelectorRef">حدد الحقل</label>
        <select
          ref={fieldSelectorRef}
          id="fieldSelectorRef"
          className="select"
          value={
            state.currentSymbology.symbologyField
              ? state.currentSymbology.symbologyField
              : ""
          }
          onChange={(event) =>
            updateSymbologyProps({
              property: "symbologyField",
              newValue: event.target.value,
            })
          }
        >
          <option value="" hidden>
            اختر
          </option>
          {state.currentSymbology.fields.map((field, index) => {
            return (
              <option key={index} value={field.name}>
                {field.name}
              </option>
            );
          })}
        </select>

        <label htmlFor="symbologyTypeRef">نوع التمثيل</label>
        <select
          id="symbologyTypeRef"
          className="select"
          defaultValue=""
          ref = {rendererTypeRef}
          // disabled={state.currentSymbology.symbologyField ? false : true}
          onChange={(event) =>
            updateSymbologyProps({
              property: "rendererType",
              newValue: event.target.value,
            })
          }
        >
          <option value="" hidden>
            اختر
          </option>
          <option value="simple" >
            تمثيل بسيط
          </option>
          {
          
          state.currentSymbology.numericalSymbology
            ? 
            state.targetLayer.geometryType === "point"
            ?
            numericalPointRenderers.map((symbologyType, index) => {
              if(state.currentSymbology.symbologyField)
              return (
                <option key={index} value={Object.keys(symbologyType)[0]}>
                    {Object.values(symbologyType)[0]}
                  </option>
                );
              })
              :
            numericalRenderers.map((symbologyType, index) => {
              if(state.currentSymbology.symbologyField)
              return (
                <option key={index} value={Object.keys(symbologyType)[0]}>
                    {Object.values(symbologyType)[0]}
                  </option>
                );
              })
              : textualRenderers.map((symbologyType, index) => {
              if(state.currentSymbology.symbologyField)
                return (
                  <option key={index} value={Object.keys(symbologyType)[0]}>
                    {Object.values(symbologyType)[0]}
                  </option>
                );
              })}
        </select>

        <div className="flex-row-container">
          <input
            type="checkbox"
            id="legendVisibility"
            ref={legendVisibilityRef}
            defaultChecked={true}
            disabled={state.targetLayer.id ? false : true}
            className="switch-input"
            onChange={(event) =>
              updateSymbologyProps({
                property: "legendVisible",
                newValue: event.target.checked,
              })
            }
          />
          <label htmlFor="legendVisibility" className="switch-lable"></label>
          <label htmlFor="legendVisibility">إظهار بمفتاح الخريطة</label>
        </div>
        تحديد الشفافية
          <div ref={transparencySliderDiv}></div>        
      </div>

      {state.currentSymbology.rendererType && (
        <div className="flex-column-container">{showRendererOptions()}</div>
      )}
    </div>
  );
}
