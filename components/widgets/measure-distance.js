import { useState, useRef, useEffect,useContext } from "react";
import DistanceMeasurement2D from '@arcgis/core/widgets/DistanceMeasurement2D'
import { AppContext } from "../../pages";

let DistanceMeasurement2DWidget;
export default function DistanceMeasurement2DComponent({view,sendBackWidget}) {
  const DistanceMeasurement2DRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    DistanceMeasurement2DWidget = new DistanceMeasurement2D()
    DistanceMeasurement2DWidget.view = view;
    DistanceMeasurement2DWidget.container = DistanceMeasurement2DRef.current;
    DistanceMeasurement2DWidget.render()
    sendBackWidget({DistanceMeasurement2D:DistanceMeasurement2DWidget})
  },[]);

  return (
    <div style={styles.container} ref={DistanceMeasurement2DRef}></div>
  );
}
