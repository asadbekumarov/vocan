const React = require("react");

const AnimatePresence = ({ children }) => children;

const usePresence = () => [true, null];

const MotionContext = React.createContext({});

const MotionConfigContext = React.createContext({});

// moti uses PresenceContext from framer-motion.  When the metro resolver
// redirects the `framer-motion` import to this stub on iOS/Android we were
// previously not exporting a PresenceContext at all.  That meant
// `import { PresenceContext } from 'framer-motion'` produced `undefined` and
// `useContext(undefined)` threw the `$typeof of undefined` error shown in the
// crash log.  Export a simple context here so the native build can safely
// read from it.
const PresenceContext = React.createContext([true, null]);

const motion = {
  div: React.forwardRef(function Div(props, ref) {
    const { children, ...rest } = props;
    return React.createElement("div", { ref, ...rest }, children);
  }),
  span: React.forwardRef(function Span(props, ref) {
    const { children, ...rest } = props;
    return React.createElement("span", { ref, ...rest }, children);
  }),
  View: React.forwardRef(function View(props, ref) {
    const { children, ...rest } = props;
    return React.createElement("div", { ref, ...rest }, children);
  }),
};

const LayoutGroup = ({ children }) => children;

module.exports = {
  AnimatePresence,
  usePresence,
  motion,
  LayoutGroup,
  MotionContext,
  MotionConfigContext,
  PresenceContext, // ensure this is defined for moti
};
