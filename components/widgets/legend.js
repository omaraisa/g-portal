import { useRef, useEffect, useContext } from "react";
import Legend from '@arcgis/core/widgets/Legend'
import { AppContext } from "../../pages";

let LegendWidget;
export default function LegendComponent({sendBackWidget}) {
  const {view} = useContext(AppContext);
  const legendRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    if(view)
    {
    LegendWidget =new Legend()
    LegendWidget.view = view;
    LegendWidget.container = legendRef.current;
    LegendWidget.render()
    sendBackWidget({legend:LegendWidget})
  }
  },[view]);


  return (
     <div style={styles.container} ref={legendRef}></div>
  );
}
