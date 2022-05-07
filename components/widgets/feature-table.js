import { useRef, useEffect, useContext } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import { AppContext } from "../../pages";

let featureTableWidget;
export default function FeatureTableComponent(props) {
  const {view,targetLayers } = useContext(AppContext);
  const featureTableRef = useRef();
  const styles = {
    container: {
      direction:"ltr",
    },
  };

  useEffect(() => {
    if (targetLayers.FeatureTableLayer) {
      const targetLayer = targetLayers.FeatureTableLayer;
      const fieldConfigs = targetLayer.fields.map((field) => ({
        name: field.name,
        label: field.name,
        visible: true,
      }))
      
      featureTableWidget
      ? updateFeatureTable()
      : insertFeatureTable()

      function updateFeatureTable() {
        featureTableWidget.layer = targetLayer
        featureTableWidget.fieldConfigs=fieldConfigs
      }

      function insertFeatureTable() {
        featureTableWidget = new FeatureTable({
          view,
          fieldConfigs:fieldConfigs,
          layer:targetLayer,
          container : featureTableRef.current,
        });
        featureTableWidget.render();
      }
    }
  }, [targetLayers],()=>featureTableWidget.destroy());

  return <div style={styles.container} ref={featureTableRef}></div>;
}
