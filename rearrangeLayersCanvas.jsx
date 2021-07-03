/**
 * Rearrange several layers into a grid pattern by wrapping artboards around
 * them and then triggering the native Rearrange Artboards commands
 * Top > Bottom, then Left > Right
 *
 * Reference results here:
 * https://imgur.com/a/2SlC2dN
 *
 * Author: Tom Scharstein
 * https://github.com/Inventsable
 */

var doc = app.activeDocument;

// Polyfill for ES6 Array iteration
Array.prototype.forEach = function (callback) {
  for (var i = 0; i < this.length; i++) callback(this[i], i, this);
};

// Utility for converting AI Collections to standard Arrays
function get(type, parent, deep) {
  if (arguments.length == 1 || !parent) {
    parent = app.activeDocument;
    deep = true;
  }
  var result = [];
  if (!parent[type]) return [];
  for (var i = 0; i < parent[type].length; i++) {
    result.push(parent[type][i]);
    if (parent[type][i][type] && deep)
      result = [].concat(result, get(type, parent[type][i]));
  }
  return result || [];
}

// Iterate over each layer in order
get("layers").forEach(function (layer, index) {
  var left = [],
    top = [],
    right = [],
    bottom = [];

  // Iterate over all the pageItems of this layer
  get("pageItems", layer).forEach(function (item) {
    // Collect the bounding box of this item
    var bounds = getVisibleBounds(item, true);
    left.push(bounds[0]);
    top.push(bounds[1]);
    right.push(bounds[2]);
    bottom.push(bounds[3]);
  });

  // Find the max dimension of this side to create layer bounding box
  var hitbox = [
    left.sort()[0],
    top.sort()[0],
    right.sort().reverse()[0],
    bottom.sort().reverse()[0],
  ];

  // Determine if hijacking an artboard or needing to create a new one
  var artboard =
    index >= doc.artboards.length
      ? doc.artboards.add(hitbox)
      : doc.artboards[index];
  // If hijacked, reassign the bounding box, then name it same as layer
  artboard.artboardRect = hitbox;
  artboard.name = layer.name;
});

// Now just call the standard Rearrange Artboards command
app.executeMenuCommand("ReArrange Artboards");

// Thanks m1b
// https://graphicdesign.stackexchange.com/a/138086
function getVisibleBounds(item, geometric) {
  var bounds;
  if (item.typename == "GroupItem" && item.clipped) {
    var clippingItem;
    for (var i = 0; i < item.pageItems.length; i++) {
      if (item.pageItems[i].clipping) {
        clippingItem = item.pageItems[i];
        break;
      } else if (item.pageItems[i].typename == "CompoundPathItem") {
        if (item.pageItems[i].pathItems[0].clipping) {
          clippingItem = item.pageItems[i];
          break;
        }
      }
    }
    bounds = geometric
      ? clippingItem.geometricBounds
      : clippingItem.visibleBounds;
  } else {
    bounds = geometric ? item.geometricBounds : item.visibleBounds;
  }
  return bounds;
}
