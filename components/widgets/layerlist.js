import { useRef, useEffect, useContext } from "react";
import LayerList from '@arcgis/core/widgets/LayerList'
import { AppContext } from "../../pages";

let LayerListWidget;
export default function LayerListComponent({sendBackWidget}) {
  const { view } = useContext(AppContext);
  const LayerListRef = useRef()
  const styles = {
    container: {
      height: "100%"
    },
  };
  
  useEffect(()=> {
    if(view)
    {
    LayerListWidget =new LayerList()
    LayerListWidget.view = view;
    LayerListWidget.container = LayerListRef.current;
    LayerListWidget.render()
    sendBackWidget({layerlist:LayerListWidget})
  }
},[view]);

  return (
    <div style={styles.container} ref={LayerListRef}></div>
  );
}
