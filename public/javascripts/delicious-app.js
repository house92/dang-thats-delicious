import "../sass/style.scss";

import { $, $$ } from "./modules/bling";
import autocomplete from "./modules/autocomplete";
import typeAhead from "./modules/typeAhead";
import makeMap from "./modules/map";
import ajaxHeart from "./modules/heart";

autocomplete( $("input.address"), $("input.lat"), $("input.lng"));

typeAhead($(".search"));

makeMap($("#map"));

const heartForms = $$("form.heart");
heartForms.on("submit", ajaxHeart);