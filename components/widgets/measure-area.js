import { useState, useRef, useEffect,useContext } from "react";
import AreaMeasurement2D from '@arcgis/core/widgets/AreaMeasurement2D'
import { AppContext } from "../../pages";

let AreaMeasurement2DWidget;
export default function AreaMeasurement2DComponent({view,sendBackWidget}) {
  const AreaMeasurement2DRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    AreaMeasurement2DWidget = new AreaMeasurement2D()
    AreaMeasurement2DWidget.view = view;
    AreaMeasurement2DWidget.container = AreaMeasurement2DRef.current;
    AreaMeasurement2DWidget.render()
    sendBackWidget({AreaMeasurement2D:AreaMeasurement2DWidget})
  },[]);

  return (
    <div style={styles.container} ref={AreaMeasurement2DRef}></div>
  );
}
