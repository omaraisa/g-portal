import { useState, useRef, useEffect } from "react";
import Print from '@arcgis/core/widgets/Print'

let PrintWidget;
export default function PrintComponent({view,sendBackWidget}) {
  const PrintRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    PrintWidget =new Print()
    PrintWidget.view = view;
    PrintWidget.printServiceUrl = "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
    PrintWidget.container = PrintRef.current;
    PrintWidget.render()
    sendBackWidget({print:PrintWidget})
  },[]);

  return (
    <div style={styles.container} ref={PrintRef}></div>
  );
}
