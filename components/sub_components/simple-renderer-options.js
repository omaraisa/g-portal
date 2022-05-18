import { useState, useRef, useEffect, useContext } from "react";
import Slider from "@arcgis/core/widgets/Slider";
import * as GIS from "../../modules/gis-module";
import * as locationRendererCreator from "@arcgis/core/smartMapping/renderers/location";

export default function SimpleRendererOptoins({
  updateRenderers,
  targetLayer,
  currentSymbology
}) {
  const [state,setState] = useState({
    layer: targetLayer,
  })

  useEffect(()=> {
    currentSymbology.renderers.simple
    ? setUserDefinedSymbology()
    : setNewSymbology()

    function setUserDefinedSymbology() {
      targetLayer.renderer = currentSymbology.renderers.simple
    }
    function setNewSymbology() {
      locationRendererCreator.createRenderer(state)
          .then(function(response) {
            targetLayer.renderer = response.renderer;
          });
    }
  },[])


  const [
    symbolSizeSliderDiv,
    outlineSizeSliderDiv,
  ] = [ useRef(), useRef()];

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


  
   
  function rendererHandler({property,newValue}) {   
    const renderer = targetLayer.renderer.clone()
          const updateSymbology = {
            symbolStyle: () => updateSymbolStyle(newValue),
            color: () => updateColor(newValue),
            outlineColor: () => updateOutlineColor(newValue),
            symbolSize: () => updateSymbolSize(newValue),
            outlineSize: () => updateOutlineSize(newValue),
          };

          function updateColor(color) {
            renderer.symbol.color = color
            return renderer
          }
          function updateSymbolStyle(style) {
            renderer.symbol.style = style
            return renderer
          }
          function updateSymbolSize(size) {
            renderer.symbol.size = size
            renderer.symbol.width = size
            return renderer
          }
          function updateOutlineColor(color) {
            renderer.symbol.outline.color = color
            return renderer
          }
          function updateOutlineSize(width) {
            renderer.symbol.outline.width = width
            return renderer
          }
          
          if(updateSymbology[property])
          {
            const newRenderer = updateSymbology[property]()
            targetLayer.renderer = newRenderer
            updateRenderers(newRenderer)
          }
          
  }



  return (
    <div
      className="flex-column-container"
      style={{ border: "solid 1px #e7e7e7", padding: "1rem" }}
    >
    <b>خصائص التمثيل البسيط</b>
      <label htmlFor="simpleSymbolSelector">اختر الرمز </label>
      <select
        id="simpleSymbolSelector"
        
        onChange={(event) =>
          rendererHandler({
            property: "symbolStyle",
            newValue: event.target.value,
          })
        }
      >
        <option value="" hidden>
          اختر
        </option>
        {GIS.listSymbolStyles(targetLayer.geometryType)}
      </select>

      <label htmlFor="symbolColor">تغيير اللون</label>
      <input
        id="symbolColor"
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