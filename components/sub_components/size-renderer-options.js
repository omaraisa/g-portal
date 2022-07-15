import { useState, useRef, useEffect, useContext } from "react";
import * as GIS from "../../modules/gis-module";
import Slider from "@arcgis/core/widgets/Slider";
import * as sizeRendererCreator from "@arcgis/core/smartMapping/renderers/size";

export default function SizeRendererOptions({
  updateRenderers,
  targetLayer,
  currentSymbology,
}) {
  const [symbolStyleRef, outlineSizeSliderDiv] = [
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
      width: 2,
      outlineWidth:1,
      color: "rgba(252, 146, 31, 0.77)",
      outlineColor: "#ffffff",
    },
  });
  const stateRef = useRef();
  stateRef.current = state;

  
  useEffect(() => {
    if(state.rendererParams.field !==currentSymbology.symbologyField)
    {
      let newState = {...state}
      if(currentSymbology.renderers.size)
      {
        newState = {...state,rendererParams:{...currentSymbology.renderers.size.rendererParams,field: currentSymbology.symbologyField}}
        setState(newState)
      }
      sizeRendererCreator
      .createClassBreaksRenderer(newState.rendererParams)
      .then(function (response) {
        targetLayer.renderer = response.renderer;
      });
    }
  },[currentSymbology.symbologyField])

  useEffect(() => {
    currentSymbology.renderers.size
      ? setUserDefinedSymbology()
      : setNewSymbology();

    function setUserDefinedSymbology() {
      targetLayer.renderer = currentSymbology.renderers.size.renderer;
      setState({...state,rendererParams:{...currentSymbology.renderers.size.rendererParams}})
    }
    function setNewSymbology() {
      sizeRendererCreator
        .createClassBreaksRenderer(state.rendererParams)
        .then(function (response) {
          targetLayer.renderer = response.renderer;
        });
    }
  }, []);

  useEffect(() => {
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

    haloSizeSlider.on("thumb-drag", (event) =>
      rendererHandler({
        property: "outlineSize",
        newValue: event.value,
      })
    );
  }, [outlineSizeSliderDiv]);

  
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
      category.symbol.color = state.rendererParams.color 
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
      color: () => updateColor(newValue),
      outlineColor: () => updateOutlineColor(newValue),
      symbolColor: () => updateSymbolColor(newValue),
      outlineSize: () => updateOutlineSize(newValue),
    };

    async function updateClassificationMethod(classificationMethod) {
      const newParams = { ...state.rendererParams, classificationMethod };
      return sizeRendererCreator
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
      return sizeRendererCreator
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
      function updateColor(color) {
        const newState = {...state,
          rendererParams: { ...state.rendererParams, color },
        };
        setState(newState)
        return {renderer:alterAllSymbols(renderer,"color",color) ,rendererParams : newState.rendererParams}
      }
      function updateSymbolColor(size) {
        const newState = {...state,
          rendererParams: { ...state.rendererParams, color },
        };
        setState(newState)
        return {renderer:alterAllSymbols(renderer,"color",color) ,rendererParams : newState.rendererParams}
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
      <b>خصائص التمثيل بالحجم</b>
      <label htmlFor="sizeClassificationMethods"> اختر طريقة التمثيل </label>
      <select
        id="sizeClassificationMethods"
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

      {targetLayer.geometryType !== "polygon" && (
         <div className="flex-column-container">
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
      </div>
      )}

      <label htmlFor="outlineColor">تغيير اللون</label>
      <input
        id="outlineColor"
        type="color"
        onChange={(event) =>
          rendererHandler({
            property: "color",
            newValue: event.target.value,
          })
        }
      ></input>
      {targetLayer.geometryType !== "polyline" && (
        <div className="flex-column-container">
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
       </div>
      )}
      <div
        className="flex-column-container"
        style={{ marginTop: "2rem", gap: "4rem" }}
      >
        {targetLayer.geometryType !== "polyline" && (
          <div className="flex-column-container">
            حجم الاطار
            <div ref={outlineSizeSliderDiv}></div>
          </div>
        )}
      </div>
    </div>
  );
}
