import styles from './nav-button.module.css'
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export default function NavButton(props) {
  const NavButtonClass = props.activeNav? styles.navButtonActive : styles.navButton
const toolTip = props.toolTip
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      <h5>{toolTip}</h5>
    </Tooltip>
  );

  return (    
    <OverlayTrigger
    placement="bottom"
    delay={{ show: 250, hide: 400 }}
    overlay={renderTooltip}
  >
    <div className={NavButtonClass} onClick={props.goTo}>
       <i className={`${props.iconClass} ${styles.iconStyle}`} ></i> 
    </div>
    </OverlayTrigger>
  )
}
