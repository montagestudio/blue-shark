/*global require, exports, document, Error*/

/**
 * Inject needed css Rule.
 */
var sheet = (document.styleSheets[0] || (function() {

    // Create the <style> tag
    var style = document.createElement("style");

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style.sheet;
})());

sheet.insertRule(".montage--Draggable.isDragging * { pointer-events: none; }", 0);


/**
 * @class DragDropComponentManager
 */
var DragDropComponentManager = function DragDropComponentManager () {
    this._draggableComponentRegistry = Object.create(null);
    this._dropZoneComponentRegistry = Object.create(null);

    this.listenFilesDragDrop();
};


DragDropComponentManager.prototype.registerDraggableComponent = function (component) {
    if (component && typeof component === "object") { //todo: instanceof
        this._draggableComponentRegistry[component.uid] = component;

        return true;
    }

    return false;
};


DragDropComponentManager.prototype.registerDropZoneComponent = function (component) {
    if (component && typeof component === "object") { //todo: instanceof
        this._dropZoneComponentRegistry[component.uid] = component;

        return true;
    }

    return false;
};


DragDropComponentManager.prototype.releaseDropZoneComponent = function (component) {
    if (component && typeof component === "object" && this._dropZoneComponentRegistry[component.uid]) {
        delete this._dropZoneComponentRegistry[component.uid];

        return true;
    }

    return false;
};


DragDropComponentManager.prototype.releaseDraggableComponentWithUUID = function (id) {
    if (typeof id === "string" && this._draggableComponentRegistry[id]) {
        delete this._draggableComponentRegistry[id];

        return true;
    }

    return false;
};


DragDropComponentManager.prototype.dispatchComponentDragStart = function (draggableComponent, dragStartEvent) {
    this._dispatchEventToComponent("handleComponentDragStart", draggableComponent, dragStartEvent);
};


DragDropComponentManager.prototype.dispatchComponentDrag = function (draggableComponent, dragEvent) {
    this._dispatchEventToComponent("handleComponentDrag", draggableComponent, dragEvent);
};


DragDropComponentManager.prototype.dispatchComponentDragEnd = function (draggableComponent, dragEndEvent) {
    var dropZoneComponent = this._findDropZoneActive();

    if (dropZoneComponent) {
        if (typeof draggableComponent.willDrop === "function") {
            draggableComponent.willDrop(dropZoneComponent);
        }

        if (!draggableComponent.shouldCancelDrop && typeof dropZoneComponent.handleComponentDrop === "function") {
            dropZoneComponent.handleComponentDrop(draggableComponent);
        }
    }

    this._dispatchEventToComponent("handleComponentDragEnd", draggableComponent, dragEndEvent);
};


DragDropComponentManager.prototype._findDropZoneActive = function () {
    var dropZoneComponents = this._dropZoneComponentRegistry,
        dropZoneComponentKeys = Object.keys(dropZoneComponents),
        tmpDropZoneComponent,
        candidateDropZone;

    for (var i = 0, length = dropZoneComponentKeys.length; i < length; i++) {
        tmpDropZoneComponent = dropZoneComponents[dropZoneComponentKeys[i]];

        if (tmpDropZoneComponent.acceptDrop) {
            if (!candidateDropZone) {
                candidateDropZone = tmpDropZoneComponent;
            } else if (candidateDropZone.element.contains(tmpDropZoneComponent.element)) {
                candidateDropZone = tmpDropZoneComponent;
            }
        }
    }

    return candidateDropZone;
};


DragDropComponentManager.prototype._dispatchEventToComponent = function () {
    if (arguments.length > 0) {
        var dropZoneComponents = this._dropZoneComponentRegistry,
            dropZoneComponentKeys = Object.keys(dropZoneComponents),
            handler = arguments[0],
            dropZoneComponent;

        if (arguments.length > 1) {
            Array.prototype.splice.call(arguments, 0, 1);
        }

        for (var i = 0, length = dropZoneComponentKeys.length; i < length; i++) {
            dropZoneComponent = dropZoneComponents[dropZoneComponentKeys[i]];

            if (dropZoneComponent && typeof dropZoneComponent[handler] === "function") {
                dropZoneComponent[handler].apply(dropZoneComponent, arguments);
            }
        }
    }
};


DragDropComponentManager.prototype.listenFilesDragDrop = function () {
    var self = this,
        targetCounter = 0,

        handleFileDragEnter = function (event) {
            var dataTransfer = event.dataTransfer;

            if (dataTransfer && dataTransfer.types && dataTransfer.types.has("Files") && targetCounter++ === 0) {
                self.dispatchFilesDragStart(event);
                document.addEventListener("dragleave", handleStopListenFilesDragging);
                document.addEventListener("drop", handleStopListenFilesDragging);
            }
        },

        handleStopListenFilesDragging = function (event) {
            var dataTransfer = event.dataTransfer;

            if (dataTransfer && dataTransfer.types && dataTransfer.types.has("Files") && --targetCounter === 0) {
                self.dispatchFilesDragEnd(event);
                document.removeEventListener("drop", handleStopListenFilesDragging);
                document.removeEventListener("dragleave", handleStopListenFilesDragging);
            }
        };

    document.addEventListener("dragenter", handleFileDragEnter);
};


DragDropComponentManager.prototype.dispatchFilesDragStart = function (dragStartEvent) {
    this._dispatchEventToComponent("handleFilesDragStart", dragStartEvent);
};


DragDropComponentManager.prototype.dispatchFilesDragEnd = function (event) {
    this._dispatchEventToComponent("handleFilesDragEnd", event);
};


DragDropComponentManager._lastUID = Date.now();


DragDropComponentManager.generateUID = function () {
    return ++this._lastUID;
};


exports.defaultDragDropComponentManager = new DragDropComponentManager();
