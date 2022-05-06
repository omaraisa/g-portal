import { useState, useRef, useContext, useEffect } from "react";
import { AppContext } from "../../pages";

export default function MapFrames() {
  const { view, map, goToSubMenu } = useContext(AppContext);
  const [state, setState] = useState({
  });
  useEffect(() => {},[])

  return (
    <div className={`flex-column-container`} >
     
    </div>
  );
}
