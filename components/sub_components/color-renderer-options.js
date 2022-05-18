import { useState, useRef, useEffect, useContext } from "react";
import * as GIS from "../../modules/gis-module";
import Slider from "@arcgis/core/widgets/Slider";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color";

export default function ColorRendererOptions({
  updateRenderers,
  targetLayer,
  currentSymbology,
}) {
  const [symbolStyleRef,symbolSizeSliderDiv, outlineSizeSliderDiv] = [
    useRef(),
    useRef(),
    useRef(),
  ];
  const [state, setState] = useState({
    rendererParams: {
      layer: targetLayer,
      field: currentSymbology.symbologyField,
      //theme: "above",
      classificationMethod: "quantile", //equal-interval,  natural-breaks standard-deviation
      numClasses: 4,
      defaultSymbolEnabled: false,
      size: 8,
      width: 2,
      outlineWidth:1,
      outlineColor: "#ffffff",
    },
  });
  const stateRef = useRef();
  stateRef.current = state;

  
  useEffect(() => {
    if(state.rendererParams.field !==currentSymbology.symbologyField)
    {
      let newState = {...state}
      if(currentSymbology.renderers.color)
      {
        newState = {...state,rendererParams:{...currentSymbology.renderers.color.rendererParams,field: currentSymbology.symbologyField}}
        setState(newState)
      }
      colorRendererCreator
      .createClassBreaksRenderer(newState.rendererParams)
      .then(function (response) {
        targetLayer.renderer = response.renderer;
      });
    }
  },[currentSymbology.symbologyField])

  useEffect(() => {
    currentSymbology.renderers.color
      ? setUserDefinedSymbology()
      : setNewSymbology();

    function setUserDefinedSymbology() {
      targetLayer.renderer = currentSymbology.renderers.color.renderer;
      setState({...state,rendererParams:{...currentSymbology.renderers.color.rendererParams}})
    }
    function setNewSymbology() {
      colorRendererCreator
        .createClassBreaksRenderer(state.rendererParams)
        .then(function (response) {
          targetLayer.renderer = response.renderer;
        });
    }
  }, []);

  useEffect(() => {
    const symbolSizeSlider = new Slider({
      container: symbolSizeSliderDiv.current,
      min: 1,
      max: 40,
      values: [10],
      steps: 1,
      snapOnClickEnabled: false,
      visibleElements: {
        labels: true,
        rangeLabels: true,
      },
    });
    symbolSizeSlider.render();

    const haloSizeSlider = new Slider({
      container: outlineSizeSliderDiv.current,
      min: 0,
      max: 8,
      values: [1],
      steps: 1,
      snapOnClickEnabled: false,
      visibleElements: {
        labels: true,
        rangeLabels: true,
      },
    });
    haloSizeSlider.render();

    symbolSizeSlider.on("thumb-drag", (event) =>
      rendererHandler({
        property: "symbolSize",
        newValue: event.value,
      })
    );
    haloSizeSlider.on("thumb-drag", (event) =>
      rendererHandler({
        property: "outlineSize",
        newValue: event.value,
      })
    );
  }, [symbolSizeSliderDiv]);

  
  function alterAllSymbols(renderer,property,newValue) {
    renderer.classBreakInfos.forEach(category => {
      category.symbol[property] = newValue 
    })
    return renderer
  }
  function alterAllOutlines(renderer,property,newValue) {
    renderer.classBreakInfos.forEach(category => {
      category.symbol.outline[property] = newValue 
    })
    return renderer
  }

  
  function updateRendererWithParams(renderer,state) {
    renderer.classBreakInfos.forEach(category => {
      category.symbol.style = symbolStyleRef.current.value 
      category.symbol.size = state.rendererParams.size 
      category.symbol.width = state.rendererParams.width 
      if(targetLayer.geometryType !== "polyline")
      {
        category.symbol.outline.color = state.rendererParams.outlineColor;
        category.symbol.outline.width = state.rendererParams.outlineWidth;
      }
    })
    return renderer
  }


  async function rendererHandler({ property, newValue },state=stateRef.current) {
    const renderer = targetLayer.renderer.clone();
    const updateSymbology = {
      classificationMethod: () => updateClassificationMethod(newValue),
      numOfClasses: () => updateNumOfClasses(newValue),
      symbolStyle: () => updateSymbolStyle(newValue),
      outlineColor: () => updateOutlineColor(newValue),
      symbolSize: () => updateSymbolSize(newValue),
      outlineSize: () => updateOutlineSize(newValue),
    };

    async function updateClassificationMethod(classificationMethod) {
      const newParams = { ...state.rendererParams, classificationMethod };
      return colorRendererCreator
        .createClassBreaksRenderer(newParams)
        .then(function (response) {
          const newState = {...state,
            rendererParams: { ...state.rendererParams, classificationMethod },
          };
          setState(newState)
          return {renderer:updateRendererWithParams(response.renderer,state),rendererParams : newState.rendererParams}
        });
    }


    async function updateNumOfClasses(numClasses) {
      const newParams = { ...state.rendererParams, numClasses };
      return colorRendererCreator
        .createClassBreaksRenderer(newParams)
        .then(function (response) {
          const newState = {...state,
            rendererParams: { ...state.rendererParams, numClasses },
          };
          setState(newState)          
            return {renderer:updateRendererWithParams(response.renderer,state),rendererParams : newState.rendererParams}
          });
      }
      
      function updateOutlineColor(color) {
        const newState = {...state,
          rendererParams: { ...state.rendererParams, outlineColor:color },
        };
        setState(newState)
        return {renderer:alterAllOutlines(renderer,"color", color),rendererParams : newState.rendererParams}
      }
      function updateSymbolStyle(style) {
        const newState = {...state,
          rendererParams: { ...state.rendererParams, style },
        };
        setState(newState)
        return {renderer:alterAllSymbols(renderer,"style",style) ,rendererParams : newState.rendererParams}
      }
      function updateSymbolSize(size) {
        const newState = {...state,
          rendererParams: { ...state.rendererParams, size, width:size },
        };
        setState(newState)
        const measureUnit =
        targetLayer.geometryType === "point" ? "size" : "width";
        return {renderer:alterAllSymbols(renderer,measureUnit,size),rendererParams : newState.rendererParams}
      }
     
      function updateOutlineSize(width) {
      const newState = {...state,
        rendererParams: { ...state.rendererParams, outlineWidth:width },
      };
      setState(newState)
      return {renderer:alterAllOutlines(renderer,"width",width) ,rendererParams : newState.rendererParams}
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
      <b>خصائص التمثيل باللون</b>
      <label htmlFor="colorClassificationMethods"> اختر طريقة التمثيل </label>
      <select
        id="colorClassificationMethods"
        onChange={(event) =>
          rendererHandler({
            property: "classificationMethod",
            newValue: event.target.value,
          })
        }
      >
        <option value="quantile">Quantile</option>
        <option value="equal-interval">Equal Interval</option>
        <option value="natural-breaks">Natural Breaks</option>
        <option value="standard-deviation">Standard Deviation</option>
      </select>

      <label htmlFor="numOfClassess"> حدد عدد التصنيفات </label>
      <input
        type="number"
        className="input-number"
        defaultValue="4"
        id="numOfClassess"
        min="3"
        max="10"
        onChange={(event) =>
          rendererHandler({
            property: "numOfClasses",
            newValue: event.target.value,
          })
        }
      ></input>

      <label htmlFor="symbolStyle">اختر الرمز </label>
      <select
        id="symbolStyle"
        ref={symbolStyleRef}
        onChange={(event) =>
          rendererHandler({
            property: "symbolStyle",
            newValue: event.target.value,
          })
        }
      >
        {GIS.listSymbolStyles(targetLayer.geometryType)}
      </select>

      <label htmlFor="outlineColor">تغيير لون الاطار</label>
      <input
        id="outlineColor"
        type="color"
        onChange={(event) =>
          rendererHandler({
            property: "outlineColor",
            newValue: event.target.value,
          })
        }
      ></input>
      <div
        className="flex-column-container"
        style={{ marginTop: "2rem", gap: "4rem" }}
      >
        تحديد الحجم
        {targetLayer.geometryType !== "polygon" && (
          <div ref={symbolSizeSliderDiv}></div>
        )}
        {targetLayer.geometryType !== "polyline" && (
          <div className="flex-column-container">
            <div ref={outlineSizeSliderDiv}></div>
          </div>
        )}
      </div>
    </div>
  );
}
