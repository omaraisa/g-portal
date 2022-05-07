import DefaultBottomPane from "./sub_components/default-bottom-pane";
import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
const FeatureTable = React.lazy(() => import('./widgets/feature-table'))

const components = {
  DefaultBottomPane: DefaultBottomPane,
  FeatureTable:FeatureTable,
};
const bottomPanePreviousComponents = {
  Pane2: "Pane",
};
const styles = {
  container : {
    height: "100%",
    display: "flex",
    alignItems:"stretch",
    flexFlow: "column wrap",
    overflow: "hidden"
  },
}

export default function BottomPane(props) {
  const CurrentComponent = components[props.currentComponent];
  const previousComponent = bottomPanePreviousComponents[props.currentComponent];
  return (
    <div style={styles.container}>
      {previousComponent &&
        <i className="fas fa-arrow-circle-right backBtn" onClick={() => props.goBack(previousComponent)}></i>
    }
      <Suspense fallback={<Loading />}>
      <CurrentComponent  addWidget={props.addWidget} sendBackWidget={props.sendBackWidget} map={props.map} view={props.view}/>
      </Suspense>
    </div>
  );
}
