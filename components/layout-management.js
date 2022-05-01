export const defaultLayout = {
  leftPaneArrow: "◀",
  leftPaneFlex: 0.2,
  leftPaneMinSize: 150,
  leftPaneMaxSize: 500,
  leftPaneMinimized: false,
  rightPaneArrow: "▶",
  rightPaneFlex: 0.2,
  rightPaneMinSize: 300,
  rightPaneMaxSize: 500,
  rightPaneMinimized: false,
  middlePaneFlex: 0.6,
  middlePaneMinSize: 600,
  animationOn: false,
  subMenuCurrentComponent: "UnionAnalysis",
};

export const LayoutManager = (state,action) => {
  switch (action.type) {
    case 'goToSubMenu':
      return goToSubMenu(state, action.targetComponent);
    case 'changeLayout':
      return changeLayout(state,action)
    case 'goToPreSubMenu':
      return goToPreSubMenu(state,action)
    case 'resizeMenu':
      return resizeMenu(state,action)
    case 'toggleMenus':
      return toggleMenus(state,action)
    default:
      return {type:"error", title:"إجراء خاطئ", body:"تعذر تعديل واجهة التطبيق بالشكل الذي تريده"}
     
  }


}

   const updateMenusProps = ([side,newMiddlePaneFlex,paneArrow,paneFlex,paneMinSize,paneMaxSize,paneMinimized,animationOn]) => {
    const updatedMenuProps = {}
    updatedMenuProps[`middlePaneFlex`] = newMiddlePaneFlex
    updatedMenuProps[`${side}PaneArrow`] = paneArrow
    updatedMenuProps[`${side}PaneFlex`] = paneFlex
    updatedMenuProps[`${side}PaneMinSize`] = paneMinSize
    updatedMenuProps[`${side}PaneMaxSize`] = paneMaxSize
    updatedMenuProps[`${side}PaneMinimized`] = paneMinimized
    updatedMenuProps[`animationOn`] = animationOn
    return updatedMenuProps
  }


   const toggleMenus = (state,{side})  =>  {
    if(side === "right")
    {
    const newLayout = state.layout.rightPaneMinimized?
    {...state.layout,...updateMenusProps(["right",(state.layout.middlePaneFlex - 0.2),"▶",0.21,200,500,false,true])}
    :
    {...state.layout,...updateMenusProps(["right",(state.layout.middlePaneFlex + state.layout.rightPaneFlex),"◀",0,0,1,true,true])}
    const newState = {...state,layout:newLayout}
    return newState
  }
  if(side === "left")
  {
    const newLayout = state.layout.leftPaneMinimized?
    {...state.layout,...updateMenusProps(["left",(state.layout.middlePaneFlex - 0.2),"◀",0.21,150,500,false,true])}
    :
    {...state.layout,...updateMenusProps(["left",(state.layout.middlePaneFlex + state.layout.leftPaneFlex),"▶",0,0,1,true,true])}
    const newState = {...state,layout:newLayout}
    return newState
  }
  }

  
   const changeLayout = (state,{event, targetPaneFlex})   => {
    const newPaneFlex = event.component.props.flex;
    const deltaFlex = newPaneFlex - state.layout[targetPaneFlex];
    const newMiddlePaneFlex = state.layout.middlePaneFlex - deltaFlex;
    let newState = {...state,layout:{...state.layout,middlePaneFlex:newMiddlePaneFlex}} 
    newState.layout[targetPaneFlex] = newPaneFlex;
    return newState
  }
  
   const resizeMenu = (state,{dragStatus})   => {
    if(dragStatus === "start")  
    return {...state,layout:{...state.layout,animationOn:false}};
    if(dragStatus === "end")   
    return {...state,layout:{...state.layout,animationOn:true}};
  }
  
   const goToSubMenu =  (state,targetComponent)  =>  {
    return {...state,layout:{...state.layout,subMenuCurrentComponent:targetComponent}} 
  }

   const goToPreSubMenu =  (state,{previousComponent})  =>  {
    if(previousComponent)
    return {...state,layout:{...state.layout,subMenuCurrentComponent:previousComponent}}
  }
  
  
  