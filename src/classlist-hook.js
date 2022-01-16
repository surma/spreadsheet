import { options } from "preact";

let oldHook = options.vnode;
options.vnode = (vnode) => {
  if (vnode.props.classes) {
    vnode.props.class = vnode.props.classes.filter(Boolean).join(" ");
  }
  return oldHook?.(vnode);
};
