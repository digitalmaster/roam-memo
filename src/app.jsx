import * as React from "react";

import SidePandelWidget from "./components/sidebar-widget.jsx";
import * as queries from "./queries.js";

const config = {
  tag: "🐘",
  pluginPageTitle: "roam/sr",
};

const App = () => {
  React.useEffect(() => {
    const fn = async () => {
      // Get all cards
      const cards = await queries.getCards({
        tag: config.tag,
        pluginPageTitle: config.pluginPageTitle,
      });
      console.log("DEBUG:: ~ cards", cards);
    };

    fn();
  }, []);

  return <SidePandelWidget />;
};

export default App;
