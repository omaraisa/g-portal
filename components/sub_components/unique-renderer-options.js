import { useState, useRef, useEffect, useContext } from "react";
import * as GIS from "../../modules/gis-module";
import Slider from "@arcgis/core/widgets/Slider";
import * as typeRendererCreator from "@arcgis/core/smartMapping/renderers/type";

export default function UniqueValuesRendererOptions({
  updateRenderers,
  targetLayer,
  currentSymbology,
}) {
  const [symbolStyleRef, symbolSizeSliderDiv, outlineSizeSliderDiv] = [
    useRef(),
    useRef(),
    useRef(),
  ];
  const [state, setState] = useState({
    rendererParams: {
      layer: targetLayer,
      field: currentSymbology.symbologyField,
      sortBy: "count",
      showAllTypes:false,
      numTypes: 10,
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
    if(currentSymbology.renderers.unique)
    {
      newState = {...state,rendererParams:{...currentSymbology.renderers.unique.rendererParams,field: currentSymbology.symbologyField}}
      setState(newState)
    }
    typeRendererCreator
    .createRenderer(newState.rendererParams)
    .then(function (response) {
      targetLayer.renderer = response.renderer;
    });
  }
  },[currentSymbology.symbologyField])

  useEffect(() => {
    currentSymbology.renderers.unique
      ? getUserDefinedSymbology()
      : setNewSymbology();

    function getUserDefinedSymbology() {
      targetLayer.renderer = currentSymbology.renderers.unique.renderer;
      setState({...state,rendererParams:{...currentSymbology.renderers.unique.rendererParams}})
    }
    function setNewSymbology() {
      typeRendererCreator
        .createRenderer(state.rendererParams)
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

  function alterAllSymbols(renderer, property, newValue) {
    renderer.uniqueValueInfos.forEach((category) => {
      category.symbol[property] = newValue;
    });
    return renderer;
  }
  function alterAllOutlines(renderer, property, newValue) {
    renderer.uniqueValueInfos.forEach((category) => {
      category.symbol.outline[property] = newValue;
    });
    return renderer;
  }

  function updateRendererWithParams(renderer, state) {
    renderer.uniqueValueInfos.forEach((category) => {
      category.symbol.style = symbolStyleRef.current.value;
      category.symbol.size = state.rendererParams.size;
      category.symbol.width = state.rendererParams.width;
      if(targetLayer.geometryType !== "polyline")
      {
        category.symbol.outline.color = state.rendererParams.outlineColor;
        category.symbol.outline.width = state.rendererParams.outlineWidth;
      }
    });
    return renderer;
  }

  async function rendererHandler({ property, newValue }, state = stateRef.current) {
    const renderer = targetLayer.renderer.clone();
    const updateSymbology = {
      sortingMethod: () => updateSortingMethod(newValue),
      showAllTypes: () => updateAllTypesVisibility(newValue),
      symbolStyle: () => updateSymbolStyle(newValue),
      color: () => updateColor(newValue),
      outlineColor: () => updateOutlineColor(newValue),
      symbolSize: () => updateSymbolSize(newValue),
      outlineSize: () => updateOutlineSize(newValue),
    };

    async function updateSortingMethod(sortBy) {
      const typeParams = { ...state.rendererParams, sortBy };
      return typeRendererCreator.createRenderer(typeParams).then(function (response) {
        const newState = { ...state, rendererParams: { ...typeParams } };
        setState(newState);
        return {renderer:updateRendererWithParams(response.renderer, newState),rendererParams : newState.rendererParams}
        
      });
    }

    async function updateAllTypesVisibility(visibility) {
      const numTypes = visibility ? -1 : 10;
      const typeParams = { ...state.rendererParams, numTypes,showAllTypes:visibility };
      return typeRendererCreator.createRenderer(typeParams).then(function (response) {
        const newState = { ...state, rendererParams: { ...typeParams } };
        setState(newState);
        return {renderer:updateRendererWithParams(response.renderer, newState) ,rendererParams : newState.rendererParams}
      });
    }


    function updateOutlineColor(color) {
      const newState = {...state,
        rendererParams: { ...state.rendererParams, outlineColor:color },
      }
      setState(newState);
      return {renderer:alterAllOutlines(renderer,"color", color) ,rendererParams : newState.rendererParams}
    }
    function updateSymbolStyle(style) {
      const newState = {...state,
        rendererParams: { ...state.rendererParams, style },
      }
      setState(newState);
      return {renderer: alterAllSymbols(renderer,"style",style)  ,rendererParams : newState.rendererParams}
    }
    function updateSymbolSize(size) {
      const newState= {
        ...state,
        rendererParams: { ...state.rendererParams, size, width: size },
      };
      const measureUnit =
      targetLayer.geometryType === "point" ? "size" : "width";
      setState(newState);
      return {renderer: alterAllSymbols(renderer,measureUnit,size) ,rendererParams : newState.rendererParams}
    }
   
    function updateOutlineSize(width) {
      const newState = {
        ...state,
        rendererParams: { ...state.rendererParams, outlineWidth:width },
      }
      setState(newState);
      return {renderer: alterAllOutlines(renderer,"width",width) ,rendererParams : newState.rendererParams}
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
      <b>خصائص التمثيل الفريد</b>
      <label htmlFor="sortingMethod">ترتيب على حسب </label>
      <select
        id="sortingMethod"
        defaultValue={currentSymbology.renderers.unique? currentSymbology.renderers.unique.rendererParams.sortBy : "count"}
        onChange={(event) =>
          rendererHandler({
            property: "sortingMethod",
            newValue: event.target.value,
          })
        }
      >
        <option value="count">العدد</option>
        <option value="value">القيمة</option>
      </select>

      <div className="flex-row-container">
        <input
          type="checkbox"
          id="allTypesSwitch"
          defaultChecked={currentSymbology.renderers.unique? currentSymbology.renderers.unique.rendererParams.showAllTypes : false}
          className="switch-input"
          onChange={(event) =>
            rendererHandler({
              property: "showAllTypes",
              newValue: event.target.value,
            })
          }
        />
        <label htmlFor="allTypesSwitch" className="switch-lable"></label>
        <label htmlFor="allTypesSwitch">إظهار جميع التصنيفات</label>
      </div>

      <label htmlFor="simpleSymbolSelector">اختر الرمز </label>
      <select
        id="simpleSymbolSelector"
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

      {targetLayer.geometryType !== "polyline" && (
         <div
         className="flex-column-container">
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
