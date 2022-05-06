import { useState, useRef, useEffect,useContext } from "react";
import CoordinateConversion from '@arcgis/core/widgets/CoordinateConversion'
import { AppContext } from "../../pages";

let CoordinateConversionWidget;
export default function CoordinateConversionComponent({view,sendBackWidget}) {
  const CoordinateConversionRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    CoordinateConversionWidget = new CoordinateConversion()
    CoordinateConversionWidget.view = view;
    CoordinateConversionWidget.container = CoordinateConversionRef.current;
    CoordinateConversionWidget.render()
    sendBackWidget({CoordinateConversion:CoordinateConversionWidget})
  },[]);

  return (
    <div style={styles.container} ref={CoordinateConversionRef}></div>
  );
}
