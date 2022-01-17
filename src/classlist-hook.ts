import { JSX, options } from "preact";

declare module "preact" {
  namespace h {
    namespace JSX {
      interface HTMLAttributes {
        classes?: string[];
      }
    }
  }
}

let oldHook = options.vnode;
options.vnode = (vnode) => {
  if (vnode.props.classes) {
    vnode.props.class = vnode.props.classes.filter(Boolean).join(" ");
  }
  return oldHook?.(vnode);
};
