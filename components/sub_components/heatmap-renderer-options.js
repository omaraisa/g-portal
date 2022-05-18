import { useState, useRef, useEffect, useContext } from "react";
import * as GIS from "../../modules/gis-module";
import Slider from "@arcgis/core/widgets/Slider";
import * as heatmapRendererCreator from "@arcgis/core/smartMapping/renderers/heatmap";
import * as heatmapSchemes from "@arcgis/core/smartMapping/symbology/heatmap";

const heatMapSchemas = [
  "Heatmap 1",
  "Heatmap 2",
  "Heatmap 3",
  "Heatmap 4",
  "Heatmap 5",
  "Heatmap 6",
  "Heatmap 7",
  "Heatmap 8",
  "Heatmap 9",
  "Heatmap 10",
  "Heatmap 11",
  "Heatmap 12",
  "Heatmap 13",
  "Heatmap 14",
  "Heatmap 15",
  "Heatmap 16",
  "Heatmap 17",
  "Heatmap 18",
  "Heatmap 19",
  "Heatmap 20",
];

export default function HeatMapRendererOptions({
  updateRenderers,
  targetLayer,
  currentSymbology,
  view,
  map,
}) {
  const [ratioRangeSliderDiv,blurRangeSliderDiv] = [useRef(),useRef()];
  const [state, setState] = useState({
    rendererParams: {
      view,
      map,
      layer: targetLayer,
      field: currentSymbology.symbologyField,
      blurRadius: 10,
      minRatio: 0.1,
      maxRatio: 1,
    },
  });
  const stateRef = useRef();
  stateRef.current = state;

  useEffect(() => {
    if (stateRef.current.rendererParams.field !== currentSymbology.symbologyField) {
      let newState = { ...stateRef.current };
      if (currentSymbology.renderers.heatmap) {
        newState = {
          ...stateRef.current,
          rendererParams: {
            ...currentSymbology.renderers.heatmap.rendererParams,
            field: currentSymbology.symbologyField,
          },
        };
        setState(newState);
      }
      heatmapRendererCreator
        .createRenderer(newState.rendererParams)
        .then(function (response) {
          targetLayer.renderer = response.renderer;
        });
    }
  }, [currentSymbology.symbologyField]);

  useEffect(() => {
    currentSymbology.renderers.heatmap
      ? getUserDefinedSymbology()
      : setNewSymbology();

    function getUserDefinedSymbology() {
      targetLayer.renderer = currentSymbology.renderers.heatmap.renderer;
      setState({
        ...stateRef.current,
        rendererParams: { ...currentSymbology.renderers.heatmap.rendererParams },
      });
    }
    function setNewSymbology() {
      heatmapRendererCreator
        .createRenderer(stateRef.current.rendererParams)
        .then(function (response) {
          targetLayer.renderer = response.renderer;
        });
    }
  }, []);

  useEffect(() => {
    const ratioRangeSlider = new Slider({
      container: ratioRangeSliderDiv.current,
      min: 0.1,
      max: 1,
      values: [0.1, 1],
      steps: 0.1,
      //minLabelElement,
      //segmentElements,
      //thumbElements,
      thumbsConstrained: false,
      rangeLabelInputsEnabled: true,
      syncedSegmentsEnabled: true,
      snapOnClickEnabled: false,
      visibleElements: {
        labels: true,
        rangeLabels: true,
      },
    });
    ratioRangeSlider.on("thumb-drag", (event) => {
      const heatmapParams = {
        ...stateRef.current.rendererParams,
      };
      heatmapParams.minRatio = ratioRangeSlider.values[0];
      heatmapParams.maxRatio = ratioRangeSlider.values[1];
      
      heatmapRendererCreator
        .createRenderer(heatmapParams)
        .then(function (response) {
          targetLayer.renderer = response.renderer;
        });
        if(event.state === "stop")  rendererHandler({property: "newSliderValue",newValue:heatmapParams})
    });
   
    
    
    const blurRangeSlider = new Slider({
      container: blurRangeSliderDiv.current,
      min: 1,
      max: 20,
      values: [10],
      steps: 2,
      thumbsConstrained: false,
      rangeLabelInputsEnabled: true,
      syncedSegmentsEnabled: true,
      snapOnClickEnabled: false,
      visibleElements: {
          labels: true,
          rangeLabels: true
      }
  })
  
  blurRangeSlider.on("thumb-drag", (event) => {
    const heatmapParams = {
      ...stateRef.current.rendererParams,
    };
    heatmapParams.blurRadius = event.value
    heatmapRendererCreator
      .createRenderer(heatmapParams)
      .then(function (response) {
        targetLayer.renderer = response.renderer;
      });
      if(event.state === "stop")  rendererHandler({property: "newSliderValue",newValue:heatmapParams})
  });
 
    
  }, [ratioRangeSliderDiv]);

  async function rendererHandler(
    { property, newValue },
    state = stateRef.current
  ) {
    const renderer = targetLayer.renderer.clone();
    const updateSymbology = {
      schema: () => updateSchema(newValue),
      newSliderValue: () => updateHeatmapRatio(newValue),
    };

    async function updateSchema(schemaName) {
      const heatmapScheme = heatmapSchemes.getSchemeByName({
        basemap: view.map.basemap,
        name: schemaName,
      });
      const heatmapParams = { ...state.rendererParams, heatmapScheme };
      return heatmapRendererCreator
        .createRenderer(heatmapParams)
        .then(function (response) {
          const newState = { ...state, rendererParams: { ...heatmapParams } };
          setState(newState);
          return {
            renderer: response.renderer,
            rendererParams: newState.rendererParams,
          };
        });
    }

    function updateHeatmapRatio(heatmapParams) {
      const newState = {
        ...state,
        rendererParams: { ...heatmapParams },
      };
      setState(newState);
          return {
            renderer: targetLayer.renderer,
            rendererParams: {...heatmapParams},
          };
    }

    if (updateSymbology[property]) {
      const response = await updateSymbology[property]();
      targetLayer.renderer = response.renderer;
      updateRenderers(response);
    }
  }
  // useEffect(() => console.log(state), [state]);

  return (
    <div
      className="flex-column-container"
      style={{ border: "solid 1px #e7e7e7", padding: "1rem" }}
    >
      <b>خصائص التمثيل الحراري</b>

      <label htmlFor="heatMapSchema">اختر النمط </label>
      <select
        id="heatMapSchema"
        onChange={(event) =>
          rendererHandler({
            property: "schema",
            newValue: event.target.value,
          })
        }
      >
        {heatMapSchemas.map((schema, index) => {
          return (
            <option key={index} value={schema}>
              {schema}
            </option>
          );
        })}
      </select>

      <div
        className="flex-column-container"
        style={{ marginTop: "2rem", gap: "4rem" }}
      >
        تحديد نطاق التمثيل
          <div ref={ratioRangeSliderDiv}></div>
        تحديد مستوى الضباب
          <div ref={blurRangeSliderDiv}></div>
      </div>
    </div>
  );
}
