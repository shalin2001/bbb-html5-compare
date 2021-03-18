var require = meteorInstall({"imports":{"api":{"annotations":{"server":{"handlers":{"whiteboardAnnotations.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/handlers/whiteboardAnnotations.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleWhiteboardAnnotations
});

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let modifyWhiteboardAccess;
module.link("/imports/api/whiteboard-multi-user/server/modifiers/modifyWhiteboardAccess", {
  default(v) {
    modifyWhiteboardAccess = v;
  }

}, 2);
let clearAnnotations;
module.link("../modifiers/clearAnnotations", {
  default(v) {
    clearAnnotations = v;
  }

}, 3);
let addAnnotation;
module.link("../modifiers/addAnnotation", {
  default(v) {
    addAnnotation = v;
  }

}, 4);

function handleWhiteboardAnnotations(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  check(header, Object);

  if (header.userId !== 'nodeJSapp') {
    return false;
  }

  check(meetingId, String);
  check(body, Object);
  const {
    annotations,
    whiteboardId,
    multiUser
  } = body;
  check(annotations, Array);
  check(whiteboardId, String);
  check(multiUser, Boolean);
  clearAnnotations(meetingId, whiteboardId);
  const annotationsAdded = [];

  _.each(annotations, annotation => {
    const {
      wbId,
      userId
    } = annotation;
    annotationsAdded.push(addAnnotation(meetingId, wbId, userId, annotation));
  });

  modifyWhiteboardAccess(meetingId, whiteboardId, multiUser);
  return annotationsAdded;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"whiteboardCleared.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/handlers/whiteboardCleared.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleWhiteboardCleared
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let AnnotationsStreamer;
module.link("/imports/api/annotations/server/streamer", {
  default(v) {
    AnnotationsStreamer = v;
  }

}, 1);
let clearAnnotations;
module.link("../modifiers/clearAnnotations", {
  default(v) {
    clearAnnotations = v;
  }

}, 2);

function handleWhiteboardCleared(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, {
    userId: String,
    whiteboardId: String,
    fullClear: Boolean
  });
  const {
    whiteboardId,
    fullClear,
    userId
  } = body;

  if (fullClear) {
    AnnotationsStreamer(meetingId).emit('removed', {
      meetingId,
      whiteboardId
    });
    return clearAnnotations(meetingId, whiteboardId);
  }

  AnnotationsStreamer(meetingId).emit('removed', {
    meetingId,
    whiteboardId,
    userId
  });
  return clearAnnotations(meetingId, whiteboardId, userId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"whiteboardSend.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/handlers/whiteboardSend.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleWhiteboardSend
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let AnnotationsStreamer;
module.link("/imports/api/annotations/server/streamer", {
  default(v) {
    AnnotationsStreamer = v;
  }

}, 1);
let addAnnotation;
module.link("../modifiers/addAnnotation", {
  default(v) {
    addAnnotation = v;
  }

}, 2);
let Metrics;
module.link("/imports/startup/server/metrics", {
  default(v) {
    Metrics = v;
  }

}, 3);
const {
  queueMetrics
} = Meteor.settings.private.redis.metrics;
const {
  annotationsQueueProcessInterval: ANNOTATION_PROCESS_INTERVAL
} = Meteor.settings.public.whiteboard;
let annotationsQueue = {};
let annotationsRecieverIsRunning = false;

const process = () => {
  if (!Object.keys(annotationsQueue).length) {
    annotationsRecieverIsRunning = false;
    return;
  }

  annotationsRecieverIsRunning = true;
  Object.keys(annotationsQueue).forEach(meetingId => {
    AnnotationsStreamer(meetingId).emit('added', {
      meetingId,
      annotations: annotationsQueue[meetingId]
    });

    if (queueMetrics) {
      Metrics.setAnnotationQueueLength(meetingId, 0);
    }
  });
  annotationsQueue = {};
  Meteor.setTimeout(process, ANNOTATION_PROCESS_INTERVAL);
};

function handleWhiteboardSend(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const userId = header.userId;
  const annotation = body.annotation;
  check(userId, String);
  check(annotation, Object);
  const whiteboardId = annotation.wbId;
  check(whiteboardId, String);

  if (!annotationsQueue.hasOwnProperty(meetingId)) {
    annotationsQueue[meetingId] = [];
  }

  annotationsQueue[meetingId].push({
    meetingId,
    whiteboardId,
    userId,
    annotation
  });

  if (queueMetrics) {
    Metrics.setAnnotationQueueLength(meetingId, annotationsQueue[meetingId].length);
  }

  if (!annotationsRecieverIsRunning) process();
  return addAnnotation(meetingId, whiteboardId, userId, annotation);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"whiteboardUndo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/handlers/whiteboardUndo.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleWhiteboardUndo
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let AnnotationsStreamer;
module.link("/imports/api/annotations/server/streamer", {
  default(v) {
    AnnotationsStreamer = v;
  }

}, 1);
let removeAnnotation;
module.link("../modifiers/removeAnnotation", {
  default(v) {
    removeAnnotation = v;
  }

}, 2);

function handleWhiteboardUndo(_ref, meetingId) {
  let {
    body
  } = _ref;
  const whiteboardId = body.whiteboardId;
  const shapeId = body.annotationId;
  check(whiteboardId, String);
  check(shapeId, String);
  AnnotationsStreamer(meetingId).emit('removed', {
    meetingId,
    whiteboardId,
    shapeId
  });
  return removeAnnotation(meetingId, whiteboardId, shapeId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"clearWhiteboard.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/methods/clearWhiteboard.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearWhiteboard
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function clearWhiteboard(whiteboardId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ClearWhiteboardPubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(whiteboardId, String);
  const payload = {
    whiteboardId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendAnnotation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/methods/sendAnnotation.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => sendAnnotation
});
let sendAnnotationHelper;
module.link("./sendAnnotationHelper", {
  default(v) {
    sendAnnotationHelper = v;
  }

}, 0);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 1);

function sendAnnotation(annotation) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  sendAnnotationHelper(annotation, meetingId, requesterUserId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendAnnotationHelper.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/methods/sendAnnotationHelper.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => sendAnnotationHelper
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function sendAnnotationHelper(annotation, meetingId, requesterUserId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SendWhiteboardAnnotationPubMsg';
  const whiteboardId = annotation.wbId;
  check(annotation, Object);
  check(whiteboardId, String);

  if (annotation.annotationType === 'text') {
    check(annotation, {
      id: String,
      status: String,
      annotationType: String,
      annotationInfo: {
        x: Number,
        y: Number,
        fontColor: Number,
        calcedFontSize: Number,
        textBoxWidth: Number,
        text: String,
        textBoxHeight: Number,
        id: String,
        whiteboardId: String,
        status: String,
        fontSize: Number,
        dataPoints: String,
        type: String
      },
      wbId: String,
      userId: String,
      position: Number
    });
  } else {
    check(annotation, {
      id: String,
      status: String,
      annotationType: String,
      annotationInfo: {
        color: Number,
        thickness: Number,
        points: Array,
        id: String,
        whiteboardId: String,
        status: String,
        type: String,
        dimensions: Match.Maybe([Number])
      },
      wbId: String,
      userId: String,
      position: Number
    });
  }

  const payload = {
    annotation,
    drawEndOnly: true
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendBulkAnnotations.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/methods/sendBulkAnnotations.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => sendBulkAnnotations
});
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 0);
let sendAnnotationHelper;
module.link("./sendAnnotationHelper", {
  default(v) {
    sendAnnotationHelper = v;
  }

}, 1);

function sendBulkAnnotations(payload) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  payload.forEach(annotation => sendAnnotationHelper(annotation, meetingId, requesterUserId));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"undoAnnotation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/methods/undoAnnotation.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => undoAnnotation
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function undoAnnotation(whiteboardId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UndoWhiteboardPubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(whiteboardId, String);
  const payload = {
    whiteboardId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addAnnotation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/modifiers/addAnnotation.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addAnnotation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Annotations;
module.link("/imports/api/annotations", {
  default(v) {
    Annotations = v;
  }

}, 2);
let addAnnotationQuery;
module.link("/imports/api/annotations/addAnnotation", {
  default(v) {
    addAnnotationQuery = v;
  }

}, 3);

function addAnnotation(meetingId, whiteboardId, userId, annotation) {
  check(meetingId, String);
  check(whiteboardId, String);
  check(annotation, Object);
  const query = addAnnotationQuery(meetingId, whiteboardId, userId, annotation);

  try {
    const {
      insertedId
    } = Annotations.upsert(query.selector, query.modifier);

    if (insertedId) {
      Logger.info("Added annotation id=".concat(annotation.id, " whiteboard=").concat(whiteboardId));
    }
  } catch (err) {
    Logger.error("Adding annotation to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearAnnotations.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/modifiers/clearAnnotations.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearAnnotations
});
let Annotations;
module.link("/imports/api/annotations", {
  default(v) {
    Annotations = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearAnnotations(meetingId, whiteboardId, userId) {
  const selector = {};

  if (meetingId) {
    selector.meetingId = meetingId;
  }

  if (whiteboardId) {
    selector.whiteboardId = whiteboardId;
  }

  if (userId) {
    selector.userId = userId;
  }

  try {
    const numberAffected = Annotations.remove(selector);

    if (numberAffected) {
      if (userId) {
        Logger.info("Cleared Annotations for userId=".concat(userId, " where whiteboard=").concat(whiteboardId));
        return;
      }

      if (whiteboardId) {
        Logger.info("Cleared Annotations for whiteboard=".concat(whiteboardId));
        return;
      }

      if (meetingId) {
        Logger.info("Cleared Annotations (".concat(meetingId, ")"));
        return;
      }

      Logger.info('Cleared Annotations (all)');
    }
  } catch (err) {
    Logger.error("Removing Annotations from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeAnnotation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/modifiers/removeAnnotation.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removeAnnotation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Annotations;
module.link("/imports/api/annotations", {
  default(v) {
    Annotations = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function removeAnnotation(meetingId, whiteboardId, shapeId) {
  check(meetingId, String);
  check(whiteboardId, String);
  check(shapeId, String);
  const selector = {
    meetingId,
    whiteboardId,
    id: shapeId
  };

  try {
    const numberAffected = Annotations.remove(selector);

    if (numberAffected) {
      Logger.info("Removed annotation id=".concat(shapeId, " whiteboard=").concat(whiteboardId));
    }
  } catch (err) {
    Logger.error("Removing annotation from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/eventHandlers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 1);
let handleWhiteboardCleared;
module.link("./handlers/whiteboardCleared", {
  default(v) {
    handleWhiteboardCleared = v;
  }

}, 2);
let handleWhiteboardUndo;
module.link("./handlers/whiteboardUndo", {
  default(v) {
    handleWhiteboardUndo = v;
  }

}, 3);
let handleWhiteboardSend;
module.link("./handlers/whiteboardSend", {
  default(v) {
    handleWhiteboardSend = v;
  }

}, 4);
let handleWhiteboardAnnotations;
module.link("./handlers/whiteboardAnnotations", {
  default(v) {
    handleWhiteboardAnnotations = v;
  }

}, 5);
RedisPubSub.on('ClearWhiteboardEvtMsg', handleWhiteboardCleared);
RedisPubSub.on('UndoWhiteboardEvtMsg', handleWhiteboardUndo);
RedisPubSub.on('SendWhiteboardAnnotationEvtMsg', handleWhiteboardSend);
RedisPubSub.on('GetWhiteboardAnnotationsRespMsg', processForHTML5ServerOnly(handleWhiteboardAnnotations));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/index.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/methods.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let undoAnnotation;
module.link("./methods/undoAnnotation", {
  default(v) {
    undoAnnotation = v;
  }

}, 1);
let clearWhiteboard;
module.link("./methods/clearWhiteboard", {
  default(v) {
    clearWhiteboard = v;
  }

}, 2);
let sendAnnotation;
module.link("./methods/sendAnnotation", {
  default(v) {
    sendAnnotation = v;
  }

}, 3);
let sendBulkAnnotations;
module.link("./methods/sendBulkAnnotations", {
  default(v) {
    sendBulkAnnotations = v;
  }

}, 4);
Meteor.methods({
  undoAnnotation,
  clearWhiteboard,
  sendAnnotation,
  sendBulkAnnotations
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/publishers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Annotations;
module.link("/imports/api/annotations", {
  default(v) {
    Annotations = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function annotations() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Annotations was requested by unauth connection ".concat(this.connection.id));
    return Annotations.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Annotations', {
    meetingId,
    userId
  });
  return Annotations.find({
    meetingId
  });
}

function publish() {
  const boundAnnotations = annotations.bind(this);
  return boundAnnotations(...arguments);
}

Meteor.publish('annotations', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"streamer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/server/streamer.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  removeAnnotationsStreamer: () => removeAnnotationsStreamer,
  addAnnotationsStreamer: () => addAnnotationsStreamer,
  default: () => get
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);

function removeAnnotationsStreamer(meetingId) {
  Logger.info("Removing Annotations streamer object for meeting ".concat(meetingId));
  delete Meteor.StreamerCentral.instances["annotations-".concat(meetingId)];
}

function addAnnotationsStreamer(meetingId) {
  const streamer = new Meteor.Streamer("annotations-".concat(meetingId), {
    retransmit: false
  });
  streamer.allowRead(function allowRead() {
    if (!this.userId) return false;
    return this.userId && this.userId.includes(meetingId);
  });
  streamer.allowWrite(function allowWrite() {
    return false;
  });
}

function get(meetingId) {
  return Meteor.StreamerCentral.instances["annotations-".concat(meetingId)];
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"addAnnotation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/addAnnotation.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addAnnotation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
const ANNOTATION_TYPE_TEXT = 'text';
const ANNOTATION_TYPE_PENCIL = 'pencil'; // line, triangle, ellipse, rectangle

function handleCommonAnnotation(meetingId, whiteboardId, userId, annotation) {
  const {
    id,
    status,
    annotationType,
    annotationInfo,
    wbId,
    position
  } = annotation;
  const selector = {
    meetingId,
    id,
    userId
  };
  const modifier = {
    $set: {
      whiteboardId,
      meetingId,
      id,
      status,
      annotationType,
      annotationInfo,
      wbId
    },
    $setOnInsert: {
      position
    },
    $inc: {
      version: 1
    }
  };
  return {
    selector,
    modifier
  };
}

function handleTextUpdate(meetingId, whiteboardId, userId, annotation) {
  const {
    id,
    status,
    annotationType,
    annotationInfo,
    wbId,
    position
  } = annotation;
  const selector = {
    meetingId,
    id,
    userId
  };
  annotationInfo.text = annotationInfo.text.replace(/[\r]/g, '\n');
  const modifier = {
    $set: {
      whiteboardId,
      meetingId,
      id,
      status,
      annotationType,
      annotationInfo,
      wbId
    },
    $setOnInsert: {
      position
    },
    $inc: {
      version: 1
    }
  };
  return {
    selector,
    modifier
  };
}

function handlePencilUpdate(meetingId, whiteboardId, userId, annotation) {
  const DRAW_START = 'DRAW_START';
  const DRAW_UPDATE = 'DRAW_UPDATE';
  const DRAW_END = 'DRAW_END';
  const {
    id,
    status,
    annotationType,
    annotationInfo,
    wbId,
    position
  } = annotation;
  const baseSelector = {
    meetingId,
    id,
    userId,
    whiteboardId
  };
  let baseModifier;

  switch (status) {
    case DRAW_START:
      // on start we split the points
      // create the 'pencil_base'
      // TODO: find and removed unused props (chunks, version, etc)
      baseModifier = {
        $set: {
          id,
          userId,
          meetingId,
          whiteboardId,
          position,
          status,
          annotationType,
          annotationInfo,
          wbId,
          version: 1
        }
      };
      break;

    case DRAW_UPDATE:
      baseModifier = {
        $push: {
          'annotationInfo.points': {
            $each: annotationInfo.points
          }
        },
        $set: {
          status
        },
        $inc: {
          version: 1
        }
      };
      break;

    case DRAW_END:
      // Updating the main pencil object with the final info
      baseModifier = {
        $set: {
          whiteboardId,
          meetingId,
          id,
          status,
          annotationType,
          annotationInfo,
          wbId,
          position
        },
        $inc: {
          version: 1
        }
      };
      break;

    default:
      break;
  }

  return {
    selector: baseSelector,
    modifier: baseModifier
  };
}

function addAnnotation(meetingId, whiteboardId, userId, annotation) {
  check(meetingId, String);
  check(whiteboardId, String);
  check(annotation, Object);

  switch (annotation.annotationType) {
    case ANNOTATION_TYPE_TEXT:
      return handleTextUpdate(meetingId, whiteboardId, userId, annotation);

    case ANNOTATION_TYPE_PENCIL:
      return handlePencilUpdate(meetingId, whiteboardId, userId, annotation);

    default:
      return handleCommonAnnotation(meetingId, whiteboardId, userId, annotation);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/annotations/index.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Annotations = new Mongo.Collection('annotations');

if (Meteor.isServer) {
  // types of queries for the annotations  (Total):
  // 1. meetingId, id, userId               ( 8 )
  // 2. meetingId, id, userId, whiteboardId ( 1 )
  // 3. meetingId                           ( 1 )
  // 4. meetingId, whiteboardId             ( 1 )
  // 5. meetingId, whiteboardId, id         ( 1 )
  // 6. meetingId, whiteboardId, userId     ( 1 )
  // These 2 indexes seem to cover all of the cases
  Annotations._ensureIndex({
    id: 1
  });

  Annotations._ensureIndex({
    meetingId: 1,
    whiteboardId: 1,
    userId: 1
  });
}

module.exportDefault(Annotations);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"auth-token-validation":{"server":{"modifiers":{"clearAuthTokenValidation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/auth-token-validation/server/modifiers/clearAuthTokenValidation.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearAuthTokenValidation
});
let AuthTokenValidation;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let ClientConnections;
module.link("/imports/startup/server/ClientConnections", {
  default(v) {
    ClientConnections = v;
  }

}, 2);

function clearAuthTokenValidation(meetingId) {
  return AuthTokenValidation.remove({
    meetingId
  }, (err, num) => {
    if (err) {
      Logger.info("Error when removing auth-token-validation for meeting=".concat(meetingId));
    }

    ClientConnections.removeMeeting(meetingId);
    Logger.info("Cleared AuthTokenValidation (".concat(meetingId, ")"));
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"upsertValidationState.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/auth-token-validation/server/modifiers/upsertValidationState.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => upsertValidationState
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let AuthTokenValidation;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  }

}, 1);

function upsertValidationState(meetingId, userId, validationStatus, connectionId) {
  const selector = {
    meetingId,
    userId,
    connectionId
  };
  const modifier = {
    $set: {
      meetingId,
      userId,
      connectionId,
      validationStatus,
      updatedAt: new Date().getTime()
    }
  };

  const cb = (err, numChanged) => {
    if (err) {
      Logger.error("Could not upsert to collection AuthTokenValidation: ".concat(err));
      return;
    }

    if (numChanged) {
      Logger.info("Upserted ".concat(JSON.stringify(selector), " ").concat(validationStatus, " in AuthTokenValidation"));
    }
  };

  return AuthTokenValidation.upsert(selector, modifier, cb);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/auth-token-validation/server/index.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/auth-token-validation/server/publishers.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let AuthTokenValidation;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function authTokenValidation(_ref) {
  let {
    meetingId,
    userId
  } = _ref;
  const selector = {
    meetingId,
    userId
  };
  Logger.debug("Publishing auth-token-validation for ".concat(meetingId, " ").concat(userId));
  return AuthTokenValidation.find(selector);
}

function publish() {
  const boundAuthTokenValidation = authTokenValidation.bind(this);
  return boundAuthTokenValidation(...arguments);
}

Meteor.publish('auth-token-validation', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/auth-token-validation/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ValidationStates: () => ValidationStates
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const AuthTokenValidation = new Mongo.Collection('auth-token-validation');

if (Meteor.isServer) {
  AuthTokenValidation._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

const ValidationStates = Object.freeze({
  NOT_VALIDATED: 1,
  VALIDATING: 2,
  VALIDATED: 3,
  INVALID: 4
});
module.exportDefault(AuthTokenValidation);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"breakouts":{"server":{"handlers":{"breakoutClosed.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/handlers/breakoutClosed.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleBreakoutClosed
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let clearBreakouts;
module.link("../modifiers/clearBreakouts", {
  default(v) {
    clearBreakouts = v;
  }

}, 1);

function handleBreakoutClosed(_ref) {
  let {
    body
  } = _ref;
  const {
    breakoutId
  } = body;
  check(breakoutId, String);
  return clearBreakouts(breakoutId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"breakoutJoinURL.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/handlers/breakoutJoinURL.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleBreakoutJoinURL
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 2);

function handleBreakoutJoinURL(_ref) {
  let {
    body
  } = _ref;
  const {
    redirectToHtml5JoinURL,
    userId,
    breakoutId
  } = body;
  check(redirectToHtml5JoinURL, String);
  const selector = {
    breakoutId
  };
  const modifier = {
    $push: {
      users: {
        userId,
        redirectToHtml5JoinURL,
        insertedTime: new Date().getTime()
      }
    }
  };

  try {
    const {
      insertedId,
      numberAffected
    } = Breakouts.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added breakout id=".concat(breakoutId));
    } else if (numberAffected) {
      Logger.info("Upserted breakout id=".concat(breakoutId));
    }
  } catch (err) {
    Logger.error("Adding breakout to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"breakoutStarted.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/handlers/breakoutStarted.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleBreakoutRoomStarted
});
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 3);

function handleBreakoutRoomStarted(_ref, meetingId) {
  let {
    body
  } = _ref;
  // 0 seconds default breakout time, forces use of real expiration time
  const DEFAULT_TIME_REMAINING = 0;
  const {
    parentMeetingId,
    breakout
  } = body;
  const {
    breakoutId
  } = breakout;
  check(meetingId, String);
  const selector = {
    breakoutId
  };
  const modifier = {
    $set: Object.assign({
      users: [],
      joinedUsers: []
    }, {
      timeRemaining: DEFAULT_TIME_REMAINING
    }, {
      parentMeetingId
    }, flat(breakout))
  };

  try {
    const {
      numberAffected
    } = Breakouts.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info('Updated timeRemaining and externalMeetingId ' + "for breakout id=".concat(breakoutId));
    }
  } catch (err) {
    Logger.error("updating breakout: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"joinedUsersChanged.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/handlers/joinedUsersChanged.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => joinedUsersChanged
});
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function joinedUsersChanged(_ref) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    parentId,
    breakoutId,
    users
  } = body;
  check(parentId, String);
  check(breakoutId, String);
  check(users, Array);
  const selector = {
    parentMeetingId: parentId,
    breakoutId
  };
  const usersMapped = users.map(user => ({
    userId: user.id,
    name: user.name
  }));
  const modifier = {
    $set: {
      joinedUsers: usersMapped
    }
  };

  try {
    const numberAffected = Breakouts.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Updated joined users in breakout id=".concat(breakoutId));
    }
  } catch (err) {
    Logger.error("updating joined users in breakout: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateTimeRemaining.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/handlers/updateTimeRemaining.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUpdateTimeRemaining
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 2);

function handleUpdateTimeRemaining(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    timeRemaining
  } = body;
  check(meetingId, String);
  check(timeRemaining, Number);
  const selector = {
    parentMeetingId: meetingId
  };
  const modifier = {
    $set: {
      timeRemaining
    }
  };
  const options = {
    multi: true
  };

  try {
    const numberAffected = Breakouts.update(selector, modifier, options);

    if (numberAffected) {
      Logger.info("Updated breakout time remaining for breakouts where parentMeetingId=".concat(meetingId));
    }
  } catch (err) {
    Logger.error("Updating breakouts: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"createBreakout.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/methods/createBreakout.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => createBreakoutRoom
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function createBreakoutRoom(rooms, durationInMinutes) {
  let record = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const BREAKOUT_LIM = Meteor.settings.public.app.breakouts.breakoutRoomLimit;
  const MIN_BREAKOUT_ROOMS = 2;
  const MAX_BREAKOUT_ROOMS = BREAKOUT_LIM > MIN_BREAKOUT_ROOMS ? BREAKOUT_LIM : MIN_BREAKOUT_ROOMS;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const eventName = 'CreateBreakoutRoomsCmdMsg';

  if (rooms.length > MAX_BREAKOUT_ROOMS) {
    Logger.info("Attempt to create breakout rooms with invalid number of rooms in meeting id=".concat(meetingId));
    return;
  }

  const payload = {
    record,
    durationInMinutes,
    rooms,
    meetingId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, eventName, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"endAllBreakouts.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/methods/endAllBreakouts.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => endAllBreakouts
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function endAllBreakouts() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(meetingId, String);
  check(requesterUserId, String);
  const eventName = 'EndAllBreakoutRoomsMsg';
  return RedisPubSub.publishUserMessage(CHANNEL, eventName, meetingId, requesterUserId, null);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requestJoinURL.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/methods/requestJoinURL.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => requestJoinURL
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function requestJoinURL(_ref) {
  let {
    breakoutId,
    userId: userIdToInvite
  } = _ref;
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const userId = userIdToInvite || requesterUserId;
  const eventName = 'RequestBreakoutJoinURLReqMsg';
  return RedisPubSub.publishUserMessage(CHANNEL, eventName, meetingId, requesterUserId, {
    meetingId,
    breakoutId,
    userId
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearBreakouts.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/modifiers/clearBreakouts.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearBreakouts
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 1);

function clearBreakouts(breakoutId) {
  if (breakoutId) {
    const selector = {
      breakoutId
    };

    try {
      const numberAffected = Breakouts.remove(selector);

      if (numberAffected) {
        Logger.info("Cleared Breakouts (".concat(breakoutId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing Breakouts (".concat(breakoutId, ")"));
    }
  } else {
    try {
      const numberAffected = Breakouts.remove({});

      if (numberAffected) {
        Logger.info('Cleared Breakouts (all)');
      }
    } catch (err) {
      Logger.error('Error on clearing Breakouts (all)');
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/eventHandlers.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleBreakoutJoinURL;
module.link("./handlers/breakoutJoinURL", {
  default(v) {
    handleBreakoutJoinURL = v;
  }

}, 1);
let handleBreakoutStarted;
module.link("./handlers/breakoutStarted", {
  default(v) {
    handleBreakoutStarted = v;
  }

}, 2);
let handleUpdateTimeRemaining;
module.link("./handlers/updateTimeRemaining", {
  default(v) {
    handleUpdateTimeRemaining = v;
  }

}, 3);
let handleBreakoutClosed;
module.link("./handlers/breakoutClosed", {
  default(v) {
    handleBreakoutClosed = v;
  }

}, 4);
let joinedUsersChanged;
module.link("./handlers/joinedUsersChanged", {
  default(v) {
    joinedUsersChanged = v;
  }

}, 5);
RedisPubSub.on('BreakoutRoomStartedEvtMsg', handleBreakoutStarted);
RedisPubSub.on('BreakoutRoomJoinURLEvtMsg', handleBreakoutJoinURL);
RedisPubSub.on('RequestBreakoutJoinURLRespMsg', handleBreakoutJoinURL);
RedisPubSub.on('BreakoutRoomsTimeRemainingUpdateEvtMsg', handleUpdateTimeRemaining);
RedisPubSub.on('BreakoutRoomEndedEvtMsg', handleBreakoutClosed);
RedisPubSub.on('UpdateBreakoutUsersEvtMsg', joinedUsersChanged);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/index.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/methods.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let createBreakoutRoom;
module.link("/imports/api/breakouts/server/methods/createBreakout", {
  default(v) {
    createBreakoutRoom = v;
  }

}, 1);
let requestJoinURL;
module.link("./methods/requestJoinURL", {
  default(v) {
    requestJoinURL = v;
  }

}, 2);
let endAllBreakouts;
module.link("./methods/endAllBreakouts", {
  default(v) {
    endAllBreakouts = v;
  }

}, 3);
Meteor.methods({
  requestJoinURL,
  createBreakoutRoom,
  endAllBreakouts
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/server/publishers.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 4);
const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

function breakouts(role) {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Breakouts was requested by unauth connection ".concat(this.connection.id));
    return Breakouts.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  const User = Users.findOne({
    userId,
    meetingId
  }, {
    fields: {
      role: 1
    }
  });
  Logger.debug('Publishing Breakouts', {
    meetingId,
    userId
  });

  if (!!User && User.role === ROLE_MODERATOR) {
    const presenterSelector = {
      $or: [{
        parentMeetingId: meetingId
      }, {
        breakoutId: meetingId
      }]
    };
    return Breakouts.find(presenterSelector);
  }

  const selector = {
    $or: [{
      parentMeetingId: meetingId,
      freeJoin: true
    }, {
      parentMeetingId: meetingId,
      'users.userId': userId
    }, {
      breakoutId: meetingId
    }]
  };
  return Breakouts.find(selector);
}

function publish() {
  const boundBreakouts = breakouts.bind(this);
  return boundBreakouts(...arguments);
}

Meteor.publish('breakouts', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/breakouts/index.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Breakouts = new Mongo.Collection('breakouts');

if (Meteor.isServer) {
  // types of queries for the breakouts:
  // 1. breakoutId ( handleJoinUrl, roomStarted, clearBreakouts )
  // 2. parentMeetingId ( updateTimeRemaining )
  Breakouts._ensureIndex({
    breakoutId: 1
  });

  Breakouts._ensureIndex({
    parentMeetingId: 1
  });
}

module.exportDefault(Breakouts);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"captions":{"server":{"handlers":{"padCreate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/handlers/padCreate.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePadCreate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let fetchReadOnlyPadId;
module.link("/imports/api/captions/server/methods/fetchReadOnlyPadId", {
  default(v) {
    fetchReadOnlyPadId = v;
  }

}, 1);

function handlePadCreate(_ref) {
  let {
    body
  } = _ref;
  const {
    pad
  } = body;
  const {
    id
  } = pad;
  check(id, String);
  fetchReadOnlyPadId(id);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"padUpdate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/handlers/padUpdate.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePadUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let getDataFromChangeset;
module.link("/imports/api/captions/server/helpers", {
  getDataFromChangeset(v) {
    getDataFromChangeset = v;
  }

}, 1);
let updatePad;
module.link("/imports/api/captions/server/modifiers/updatePad", {
  default(v) {
    updatePad = v;
  }

}, 2);

function handlePadUpdate(_ref) {
  let {
    body
  } = _ref;
  const {
    pad,
    revs,
    changeset
  } = body;
  const {
    id
  } = pad;
  check(id, String);
  check(changeset, String);
  check(revs, Number);
  const data = getDataFromChangeset(changeset);

  if (data !== '') {
    updatePad(id, data, revs);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addCaptionsPads.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/addCaptionsPads.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addCaptionsPads
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 3);

function addCaptionsPads(meetingId, padIds) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'AddCaptionsPadsSysMsg';
  check(meetingId, String);
  check(padIds, [String]);
  const payload = {
    padIds
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, 'nodeJSapp', payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addPad.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/addPad.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addPad
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 3);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 4);

function addPad(padId, readOnlyId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'AddPadSysMsg';
  check(padId, String);
  check(readOnlyId, String);
  const pad = Captions.findOne({
    padId
  });

  if (!pad) {
    Logger.error("Could not find closed captions pad ".concat(padId));
    return;
  }

  const {
    meetingId
  } = pad;
  check(meetingId, String);
  const payload = {
    padId,
    readOnlyId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, 'nodeJSapp', payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"appendText.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/appendText.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => appendText
});
let axios;
module.link("axios", {
  default(v) {
    axios = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let generatePadId;
module.link("/imports/api/captions/server/helpers", {
  generatePadId(v) {
    generatePadId = v;
  }

}, 3);
let appendTextURL;
module.link("/imports/api/note/server/helpers", {
  appendTextURL(v) {
    appendTextURL = v;
  }

}, 4);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 5);

function appendText(text, locale) {
  const {
    meetingId
  } = extractCredentials(this.userId);
  check(meetingId, String);
  check(text, String);
  check(locale, String);
  const padId = generatePadId(meetingId, locale);
  axios({
    method: 'get',
    url: appendTextURL(padId, text),
    responseType: 'json'
  }).then(response => {
    const {
      status
    } = response;

    if (status !== 200) {
      Logger.error("Could not append captions for padId=".concat(padId));
      return;
    }
  }).catch(error => Logger.error("Could not append captions for padId=".concat(padId, ": ").concat(error)));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createCaptions.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/createCaptions.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => createCaptions
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let generatePadId, isEnabled, getLocalesURL;
module.link("/imports/api/captions/server/helpers", {
  generatePadId(v) {
    generatePadId = v;
  },

  isEnabled(v) {
    isEnabled = v;
  },

  getLocalesURL(v) {
    getLocalesURL = v;
  }

}, 2);
let addCaption;
module.link("/imports/api/captions/server/modifiers/addCaption", {
  default(v) {
    addCaption = v;
  }

}, 3);
let addCaptionsPads;
module.link("/imports/api/captions/server/methods/addCaptionsPads", {
  default(v) {
    addCaptionsPads = v;
  }

}, 4);
let axios;
module.link("axios", {
  default(v) {
    axios = v;
  }

}, 5);

function createCaptions(meetingId) {
  // Avoid captions creation if this feature is disabled
  if (!isEnabled()) {
    Logger.warn("Captions are disabled for ".concat(meetingId));
    return;
  }

  check(meetingId, String);
  axios({
    method: 'get',
    url: getLocalesURL(),
    responseType: 'json'
  }).then(response => {
    const {
      status
    } = response;

    if (status !== 200) {
      Logger.error("Could not get locales info for ".concat(meetingId, " ").concat(status));
      return;
    }

    const padIds = [];
    const locales = response.data;
    locales.forEach(locale => {
      const padId = generatePadId(meetingId, locale.locale);
      addCaption(meetingId, padId, locale);
      padIds.push(padId);
    });
    addCaptionsPads(meetingId, padIds);
  }).catch(error => Logger.error("Could not create captions for ".concat(meetingId, ": ").concat(error)));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editCaptions.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/editCaptions.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => editCaptions
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 3);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 4);

const getIndex = (data, length) => length - data.length;

function editCaptions(padId, data) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'EditCaptionHistoryPubMsg';
  check(padId, String);
  check(data, String);
  const pad = Captions.findOne({
    padId
  });

  if (!pad) {
    Logger.error("Editing captions history: ".concat(padId));
    return;
  }

  const {
    meetingId,
    ownerId,
    locale,
    length
  } = pad;
  check(meetingId, String);
  check(ownerId, String);
  check(locale, {
    locale: String,
    name: String
  });
  check(length, Number);
  const index = getIndex(data, length);
  const payload = {
    startIndex: index,
    localeCode: locale.locale,
    locale: locale.name,
    endIndex: index,
    text: data
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, ownerId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fetchReadOnlyPadId.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/fetchReadOnlyPadId.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => fetchReadOnlyPadId
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let getReadOnlyIdURL, getDataFromResponse;
module.link("/imports/api/note/server/helpers", {
  getReadOnlyIdURL(v) {
    getReadOnlyIdURL = v;
  },

  getDataFromResponse(v) {
    getDataFromResponse = v;
  }

}, 2);
let updateReadOnlyPadId;
module.link("/imports/api/captions/server/modifiers/updateReadOnlyPadId", {
  default(v) {
    updateReadOnlyPadId = v;
  }

}, 3);
let axios;
module.link("axios", {
  default(v) {
    axios = v;
  }

}, 4);

function fetchReadOnlyPadId(padId) {
  check(padId, String);
  const readOnlyURL = getReadOnlyIdURL(padId);
  axios({
    method: 'get',
    url: readOnlyURL,
    responseType: 'json'
  }).then(response => {
    const {
      status
    } = response;

    if (status !== 200) {
      Logger.error("Could not get closed captions readOnlyID for ".concat(padId, " ").concat(status));
      return;
    }

    const readOnlyPadId = getDataFromResponse(response.data, 'readOnlyID');

    if (readOnlyPadId) {
      updateReadOnlyPadId(padId, readOnlyPadId);
    } else {
      Logger.error("Could not get pad readOnlyID for ".concat(padId));
    }
  }).catch(error => Logger.error("Could not get pad readOnlyID for ".concat(padId, ": ").concat(error)));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"takeOwnership.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/takeOwnership.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => takeOwnership
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 1);
let updateOwnerId;
module.link("/imports/api/captions/server/modifiers/updateOwnerId", {
  default(v) {
    updateOwnerId = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);
let CAPTIONS_TOKEN;
module.link("/imports/api/captions/server/helpers", {
  CAPTIONS_TOKEN(v) {
    CAPTIONS_TOKEN = v;
  }

}, 4);

function takeOwnership(locale) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(locale, String);
  const pad = Captions.findOne({
    meetingId,
    padId: {
      $regex: "".concat(CAPTIONS_TOKEN).concat(locale, "$")
    }
  });

  if (pad) {
    updateOwnerId(meetingId, requesterUserId, pad.padId);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateOwner.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods/updateOwner.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => editCaptions
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 3);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 4);

function editCaptions(meetingId, userId, padId) {
  // TODO
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UpdateCaptionOwnerPubMsg';
  check(meetingId, String);
  check(userId, String);
  check(padId, String);
  const pad = Captions.findOne({
    meetingId,
    padId
  });

  if (!pad) {
    Logger.error("Editing captions owner: ".concat(padId));
    return;
  }

  const {
    locale
  } = pad;
  check(locale, {
    locale: String,
    name: String
  });
  const payload = {
    ownerId: userId,
    locale: locale.name,
    localeCode: locale.locale
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addCaption.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/modifiers/addCaption.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addCaption
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function addCaption(meetingId, padId, locale) {
  check(meetingId, String);
  check(padId, String);
  check(locale, {
    locale: String,
    name: String
  });
  const selector = {
    meetingId,
    padId
  };
  const modifier = {
    meetingId,
    padId,
    locale,
    ownerId: '',
    readOnlyPadId: '',
    data: '',
    revs: 0,
    length: 0
  };

  try {
    const {
      insertedId,
      numberAffected
    } = Captions.upsert(selector, modifier);

    if (insertedId) {
      Logger.verbose('Captions: added locale', {
        locale: locale.locale,
        meetingId
      });
    } else if (numberAffected) {
      Logger.verbose('Captions: upserted locale', {
        locale: locale.locale,
        meetingId
      });
    }
  } catch (err) {
    Logger.error("Adding caption to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearCaptions.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/modifiers/clearCaptions.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearCaptions
});
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearCaptions(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = Captions.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Captions (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing captions (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = Captions.remove({});

      if (numberAffected) {
        Logger.info('Cleared Captions (all)');
      }
    } catch (err) {
      Logger.error("Error on clearing captions (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateOwnerId.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/modifiers/updateOwnerId.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateOwnerId
});
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let updateOwner;
module.link("/imports/api/captions/server/methods/updateOwner", {
  default(v) {
    updateOwner = v;
  }

}, 2);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 3);

function updateOwnerId(meetingId, userId, padId) {
  check(meetingId, String);
  check(userId, String);
  check(padId, String);
  const selector = {
    meetingId,
    padId
  };
  const modifier = {
    $set: {
      ownerId: userId
    }
  };

  try {
    const numberAffected = Captions.update(selector, modifier, {
      multi: true
    });

    if (numberAffected) {
      updateOwner(meetingId, userId, padId);
      Logger.verbose('Captions: updated caption', {
        padId,
        ownerId: userId
      });
    }
  } catch (err) {
    Logger.error('Captions: error while updating pad', {
      err
    });
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updatePad.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/modifiers/updatePad.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updatePad
});
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let editCaptions;
module.link("/imports/api/captions/server/methods/editCaptions", {
  default(v) {
    editCaptions = v;
  }

}, 2);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 3);

function updatePad(padId, data, revs) {
  check(padId, String);
  check(data, String);
  check(revs, Number);
  const selector = {
    padId
  };
  const modifier = {
    $set: {
      data,
      revs
    },
    $inc: {
      length: data.length
    }
  };

  try {
    const numberAffected = Captions.update(selector, modifier, {
      multi: true
    });

    if (numberAffected) {
      editCaptions(padId, data, revs);
      Logger.verbose('Captions: updated pad', {
        padId,
        revs
      });
    }
  } catch (err) {
    Logger.error("Updating captions pad: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateReadOnlyPadId.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/modifiers/updateReadOnlyPadId.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateReadOnlyPadId
});
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let addPad;
module.link("/imports/api/captions/server/methods/addPad", {
  default(v) {
    addPad = v;
  }

}, 3);

function updateReadOnlyPadId(padId, readOnlyPadId) {
  check(padId, String);
  check(readOnlyPadId, String);
  const selector = {
    padId
  };
  const modifier = {
    $set: {
      readOnlyPadId
    }
  };

  try {
    const numberAffected = Captions.update(selector, modifier, {
      multi: true
    });

    if (numberAffected) {
      addPad(padId, readOnlyPadId);
      Logger.verbose('Captions: added readOnlyPadId', {
        padId,
        readOnlyPadId
      });
    }
  } catch (err) {
    Logger.error('Captions: error when adding readOnlyPadId', {
      err
    });
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/eventHandlers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForCaptionsPadOnly;
module.link("/imports/api/captions/server/helpers", {
  processForCaptionsPadOnly(v) {
    processForCaptionsPadOnly = v;
  }

}, 1);
let handlePadCreate;
module.link("./handlers/padCreate", {
  default(v) {
    handlePadCreate = v;
  }

}, 2);
let handlePadUpdate;
module.link("./handlers/padUpdate", {
  default(v) {
    handlePadUpdate = v;
  }

}, 3);
RedisPubSub.on('PadCreateSysMsg', processForCaptionsPadOnly(handlePadCreate));
RedisPubSub.on('PadUpdateSysMsg', processForCaptionsPadOnly(handlePadUpdate));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/helpers.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CAPTIONS_TOKEN: () => CAPTIONS_TOKEN,
  generatePadId: () => generatePadId,
  processForCaptionsPadOnly: () => processForCaptionsPadOnly,
  isEnabled: () => isEnabled,
  getLocalesURL: () => getLocalesURL,
  getDataFromChangeset: () => getDataFromChangeset
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let hashSHA1;
module.link("/imports/api/common/server/helpers", {
  hashSHA1(v) {
    hashSHA1 = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
const ETHERPAD = Meteor.settings.private.etherpad;
const CAPTIONS_CONFIG = Meteor.settings.public.captions;
const BASENAME = Meteor.settings.public.app.basename;
const APP = Meteor.settings.private.app;
const INSTANCE_ID = Meteor.settings.public.app.instanceId;
const LOCALES_URL = "http://".concat(APP.host, ":").concat(process.env.PORT).concat(BASENAME).concat(INSTANCE_ID).concat(APP.localesUrl);
const CAPTIONS_TOKEN = '_cc_';
const TOKEN = '$'; // Captions padId should look like: {prefix}_cc_{locale}

const generatePadId = (meetingId, locale) => "".concat(hashSHA1(meetingId + locale + ETHERPAD.apikey)).concat(CAPTIONS_TOKEN).concat(locale);

const isCaptionsPad = padId => {
  const splitPadId = padId.split(CAPTIONS_TOKEN);
  return splitPadId.length === 2;
};

const getDataFromChangeset = changeset => {
  const splitChangeset = changeset.split(TOKEN);

  if (splitChangeset.length > 1) {
    splitChangeset.shift();
    return splitChangeset.join(TOKEN);
  }

  return '';
};

const isEnabled = () => CAPTIONS_CONFIG.enabled;

const getLocalesURL = () => LOCALES_URL;

const processForCaptionsPadOnly = fn => function (message) {
  const {
    body
  } = message;
  const {
    pad
  } = body;
  const {
    id
  } = pad;
  check(id, String);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (isCaptionsPad(id)) return fn(message, ...args);
  return () => {};
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/index.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/methods.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let takeOwnership;
module.link("/imports/api/captions/server/methods/takeOwnership", {
  default(v) {
    takeOwnership = v;
  }

}, 1);
let appendText;
module.link("/imports/api/captions/server/methods/appendText", {
  default(v) {
    appendText = v;
  }

}, 2);
Meteor.methods({
  takeOwnership,
  appendText
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/server/publishers.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Captions;
module.link("/imports/api/captions", {
  default(v) {
    Captions = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function captions() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Captions was requested by unauth connection ".concat(this.connection.id));
    return Captions.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Captions', {
    meetingId,
    requestedBy: userId
  });
  return Captions.find({
    meetingId
  });
}

function publish() {
  const boundCaptions = captions.bind(this);
  return boundCaptions(...arguments);
}

Meteor.publish('captions', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/captions/index.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Captions = new Mongo.Collection('captions');

if (Meteor.isServer) {
  Captions._ensureIndex({
    meetingId: 1,
    padId: 1
  });
}

module.exportDefault(Captions);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"connection-status":{"server":{"methods":{"addConnectionStatus.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/server/methods/addConnectionStatus.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addConnectionStatus
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let updateConnectionStatus;
module.link("/imports/api/connection-status/server/modifiers/updateConnectionStatus", {
  default(v) {
    updateConnectionStatus = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function addConnectionStatus(level) {
  check(level, String);
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  updateConnectionStatus(meetingId, requesterUserId, level);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearConnectionStatus.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/server/modifiers/clearConnectionStatus.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearConnectionStatus
});
let ConnectionStatus;
module.link("/imports/api/connection-status", {
  default(v) {
    ConnectionStatus = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearConnectionStatus(meetingId) {
  if (meetingId) {
    return ConnectionStatus.remove({
      meetingId
    }, () => {
      Logger.info("Cleared ConnectionStatus (".concat(meetingId, ")"));
    });
  }

  return ConnectionStatus.remove({}, () => {
    Logger.info('Cleared ConnectionStatus (all)');
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateConnectionStatus.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/server/modifiers/updateConnectionStatus.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateConnectionStatus
});
let ConnectionStatus;
module.link("/imports/api/connection-status", {
  default(v) {
    ConnectionStatus = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function updateConnectionStatus(meetingId, userId, level) {
  check(meetingId, String);
  check(userId, String);
  const timestamp = new Date().getTime();
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    meetingId,
    userId,
    level,
    timestamp
  };

  const cb = (err, numChanged) => {
    if (err) {
      return Logger.error("Updating connection status: ".concat(err));
    }

    const {
      insertedId
    } = numChanged;

    if (insertedId) {
      return Logger.info("Added connection status userId=".concat(userId, " level=").concat(level));
    }

    return Logger.verbose("Update connection status userId=".concat(userId, " level=").concat(level));
  };

  return ConnectionStatus.upsert(selector, modifier, cb);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/server/index.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/server/methods.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let addConnectionStatus;
module.link("./methods/addConnectionStatus", {
  default(v) {
    addConnectionStatus = v;
  }

}, 1);
Meteor.methods({
  addConnectionStatus
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/server/publishers.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let ConnectionStatus;
module.link("/imports/api/connection-status", {
  default(v) {
    ConnectionStatus = v;
  }

}, 3);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 4);

function connectionStatus() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing ConnectionStatus was requested by unauth connection ".concat(this.connection.id));
    return ConnectionStatus.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  check(meetingId, String);
  check(userId, String);
  Logger.info("Publishing connection status for ".concat(meetingId, " ").concat(userId));
  return ConnectionStatus.find({
    meetingId
  });
}

function publish() {
  const boundNote = connectionStatus.bind(this);
  return boundNote(...arguments);
}

Meteor.publish('connection-status', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/connection-status/index.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const ConnectionStatus = new Mongo.Collection('connection-status');

if (Meteor.isServer) {
  ConnectionStatus._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

module.exportDefault(ConnectionStatus);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cursor":{"server":{"handlers":{"cursorUpdate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/cursor/server/handlers/cursorUpdate.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleCursorUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let CursorStreamer;
module.link("/imports/api/cursor/server/streamer", {
  default(v) {
    CursorStreamer = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 3);
const {
  streamerLog
} = Meteor.settings.private.serverLog;
const CURSOR_PROCCESS_INTERVAL = 30;
const cursorQueue = {};

const proccess = _.throttle(() => {
  try {
    Object.keys(cursorQueue).forEach(meetingId => {
      try {
        const cursors = cursorQueue[meetingId];
        delete cursorQueue[meetingId];
        CursorStreamer(meetingId).emit('message', {
          meetingId,
          cursors
        }); // if (streamerLog) {
        //   Logger.debug('CursorUpdate process has finished', { meetingId });
        // }
      } catch (error) {
        Logger.error("Error while trying to send cursor streamer data for meeting ".concat(meetingId, ". ").concat(error));
      }
    });
  } catch (error) {
    Logger.error("Error while processing cursor queue. ".concat(error));
  }
}, CURSOR_PROCCESS_INTERVAL);

function handleCursorUpdate(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId
  } = header;
  check(body, Object);
  check(meetingId, String);
  check(userId, String);

  if (!cursorQueue[meetingId]) {
    cursorQueue[meetingId] = {};
  } // overwrite since we dont care about the other positions


  cursorQueue[meetingId][userId] = body;
  proccess();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"publishCursorUpdate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/cursor/server/methods/publishCursorUpdate.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => publishCursorUpdate
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);

function publishCursorUpdate(meetingId, requesterUserId, payload) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SendCursorPositionPubMsg';
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/cursor/server/eventHandlers.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleCursorUpdate;
module.link("./handlers/cursorUpdate", {
  default(v) {
    handleCursorUpdate = v;
  }

}, 1);
RedisPubSub.on('SendCursorPositionEvtMsg', handleCursorUpdate);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/cursor/server/index.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/cursor/server/methods.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let publishCursorUpdate;
module.link("./methods/publishCursorUpdate", {
  default(v) {
    publishCursorUpdate = v;
  }

}, 1);
Meteor.methods({
  publishCursorUpdate
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"streamer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/cursor/server/streamer.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  removeCursorStreamer: () => removeCursorStreamer,
  addCursorStreamer: () => addCursorStreamer,
  default: () => get
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let publishCursorUpdate;
module.link("./methods/publishCursorUpdate", {
  default(v) {
    publishCursorUpdate = v;
  }

}, 1);
const {
  streamerLog
} = Meteor.settings.private.serverLog;

function removeCursorStreamer(meetingId) {
  Logger.info("Removing Cursor streamer object for meeting ".concat(meetingId));
  delete Meteor.StreamerCentral.instances["cursor-".concat(meetingId)];
}

function addCursorStreamer(meetingId) {
  const streamer = new Meteor.Streamer("cursor-".concat(meetingId), {
    retransmit: false
  });

  if (streamerLog) {
    Logger.debug('Cursor streamer created', {
      meetingId
    });
  }

  streamer.allowRead(function allowRead() {
    if (streamerLog) {
      Logger.debug('Cursor streamer called allowRead', {
        userId: this.userId,
        meetingId
      });
    }

    return this.userId && this.userId.includes(meetingId);
  });
  streamer.allowWrite(function allowWrite() {
    return this.userId && this.userId.includes(meetingId);
  });
  streamer.on('publish', message => {
    publishCursorUpdate(meetingId, message.userId, message.payload);
  });
}

function get(meetingId) {
  return Meteor.StreamerCentral.instances["cursor-".concat(meetingId)];
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"external-videos":{"server":{"handlers":{"startExternalVideo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/handlers/startExternalVideo.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleStartExternalVideo
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 3);

function handleStartExternalVideo(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId
  } = header;
  check(body, Object);
  check(meetingId, String);
  check(userId, String);
  const externalVideoUrl = body.externalVideoUrl;
  const user = Users.findOne({
    meetingId: meetingId,
    userId: userId
  });

  if (user && user.presenter) {
    try {
      Meetings.update({
        meetingId
      }, {
        $set: {
          externalVideoUrl
        }
      });
      Logger.info("User id=".concat(userId, " sharing an external video: ").concat(externalVideoUrl, " for meeting ").concat(meetingId));
    } catch (err) {
      Logger.error("Error on setting shared external video start in Meetings collection: ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stopExternalVideo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/handlers/stopExternalVideo.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleStopExternalVideo
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);

function handleStopExternalVideo(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId
  } = header;
  check(body, Object);
  check(meetingId, String);
  check(userId, String);

  try {
    Logger.info("External video stop sharing was initiated by:[".concat(userId, "] for meeting ").concat(meetingId));
    Meetings.update({
      meetingId
    }, {
      $set: {
        externalVideoUrl: null
      }
    });
  } catch (err) {
    Logger.error("Error on setting shared external video stop in Meetings collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateExternalVideo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/handlers/updateExternalVideo.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  default: () => handleUpdateExternalVideo
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let ExternalVideoStreamer;
module.link("/imports/api/external-videos/server/streamer", {
  default(v) {
    ExternalVideoStreamer = v;
  }

}, 3);

function handleUpdateExternalVideo(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId
  } = header;
  check(body, Object);
  check(meetingId, String);
  check(userId, String);
  const user = Users.findOne({
    meetingId: meetingId,
    userId: userId
  });

  if (user && user.presenter) {
    try {
      Logger.info("UpdateExternalVideoEvtMsg received for user ".concat(userId, " and meeting ").concat(meetingId, " event:").concat(body.status));
      ExternalVideoStreamer(meetingId).emit(body.status, _objectSpread({}, body, {
        meetingId: meetingId,
        userId: userId
      }));
    } catch (err) {
      Logger.error("Error on setting shared external video update in Meetings collection: ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"emitExternalVideoEvent.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/methods/emitExternalVideoEvent.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => emitExternalVideoEvent
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function emitExternalVideoEvent(options) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UpdateExternalVideoPubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const {
    status,
    playerStatus
  } = options;
  const user = Users.findOne({
    meetingId,
    userId: requesterUserId
  });

  if (user && user.presenter) {
    check(status, String);
    check(playerStatus, {
      rate: Match.Maybe(Number),
      time: Match.Maybe(Number),
      state: Match.Maybe(Boolean)
    });
    let rate = playerStatus.rate || 0;
    let time = playerStatus.time || 0;
    let state = playerStatus.state || 0;
    const payload = {
      status,
      rate,
      time,
      state
    };
    Logger.debug("User id=".concat(requesterUserId, " sending ").concat(EVENT_NAME, " event:").concat(state, " for meeting ").concat(meetingId));
    return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startWatchingExternalVideo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/methods/startWatchingExternalVideo.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => startWatchingExternalVideo
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function startWatchingExternalVideo(options) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'StartExternalVideoPubMsg';
  const {
    meetingId,
    requesterUserId: userId
  } = extractCredentials(this.userId);
  const {
    externalVideoUrl
  } = options;

  try {
    check(meetingId, String);
    check(userId, String);
    check(externalVideoUrl, String);
    const user = Users.findOne({
      meetingId,
      userId
    }, {
      presenter: 1
    });

    if (user && user.presenter) {
      check(externalVideoUrl, String);
      const payload = {
        externalVideoUrl
      };
      Logger.debug("User id=".concat(userId, " sending ").concat(EVENT_NAME, " url:").concat(externalVideoUrl, " for meeting ").concat(meetingId));
      return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
    }

    Logger.error("Only presenters are allowed to start external video for a meeting. meeting=".concat(meetingId, " userId=").concat(userId));
  } catch (error) {
    Logger.error("Error on sharing an external video: ".concat(externalVideoUrl, " ").concat(error));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stopWatchingExternalVideo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/methods/stopWatchingExternalVideo.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => stopWatchingExternalVideo
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let stopWatchingExternalVideoSystemCall;
module.link("/imports/api/external-videos/server/methods/stopWatchingExternalVideoSystemCall", {
  default(v) {
    stopWatchingExternalVideoSystemCall = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function stopWatchingExternalVideo() {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);

  try {
    check(meetingId, String);
    check(requesterUserId, String);
    const user = Users.findOne({
      meetingId,
      userId: requesterUserId
    });

    if (user && user.presenter) {
      // proceed and publish the event
      stopWatchingExternalVideoSystemCall({
        meetingId,
        requesterUserId
      });
    }
  } catch (error) {
    Logger.error("Error on stop sharing an external video for meeting=".concat(meetingId, " ").concat(error));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stopWatchingExternalVideoSystemCall.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/methods/stopWatchingExternalVideoSystemCall.js                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => stopWatchingExternalVideoSystemCall
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);

function stopWatchingExternalVideoSystemCall(_ref) {
  let {
    meetingId,
    requesterUserId
  } = _ref;
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'StopExternalVideoPubMsg';

  try {
    check(meetingId, String);
    check(requesterUserId, String); // check if there is ongoing video shared

    const meeting = Meetings.findOne({
      meetingId
    });
    if (!meeting || meeting.externalVideoUrl === null) return;
    Logger.info('ExternalVideo::stopWatchingExternalVideo was triggered ', {
      meetingId,
      requesterUserId
    });
    const payload = {};
    return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
  } catch (error) {
    Logger.error("Error on stop sharing an external video for meeting=".concat(meetingId, " ").concat(error));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/eventHandlers.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleStartExternalVideo;
module.link("./handlers/startExternalVideo", {
  default(v) {
    handleStartExternalVideo = v;
  }

}, 1);
let handleStopExternalVideo;
module.link("./handlers/stopExternalVideo", {
  default(v) {
    handleStopExternalVideo = v;
  }

}, 2);
let handleUpdateExternalVideo;
module.link("./handlers/updateExternalVideo", {
  default(v) {
    handleUpdateExternalVideo = v;
  }

}, 3);
RedisPubSub.on('StartExternalVideoEvtMsg', handleStartExternalVideo);
RedisPubSub.on('StopExternalVideoEvtMsg', handleStopExternalVideo);
RedisPubSub.on('UpdateExternalVideoEvtMsg', handleUpdateExternalVideo);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/index.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./methods");
module.link("./eventHandlers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/methods.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let startWatchingExternalVideo;
module.link("./methods/startWatchingExternalVideo", {
  default(v) {
    startWatchingExternalVideo = v;
  }

}, 1);
let stopWatchingExternalVideo;
module.link("./methods/stopWatchingExternalVideo", {
  default(v) {
    stopWatchingExternalVideo = v;
  }

}, 2);
let emitExternalVideoEvent;
module.link("./methods/emitExternalVideoEvent", {
  default(v) {
    emitExternalVideoEvent = v;
  }

}, 3);
Meteor.methods({
  startWatchingExternalVideo,
  stopWatchingExternalVideo,
  emitExternalVideoEvent
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"streamer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/external-videos/server/streamer.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  removeExternalVideoStreamer: () => removeExternalVideoStreamer,
  addExternalVideoStreamer: () => addExternalVideoStreamer,
  default: () => get
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

const allowRecentMessages = (eventName, message) => {
  const {
    userId,
    meetingId,
    time,
    rate,
    state
  } = message;
  Logger.debug("ExternalVideo Streamer auth allowed userId: ".concat(userId, ", meetingId: ").concat(meetingId, ", event: ").concat(eventName, ", time: ").concat(time, " rate: ").concat(rate, ", state: ").concat(state));
  return true;
};

function removeExternalVideoStreamer(meetingId) {
  const streamName = "external-videos-".concat(meetingId);

  if (Meteor.StreamerCentral.instances[streamName]) {
    Logger.info("Destroying External Video streamer object for ".concat(streamName));
    delete Meteor.StreamerCentral.instances[streamName];
  }
}

function addExternalVideoStreamer(meetingId) {
  const streamName = "external-videos-".concat(meetingId);

  if (!Meteor.StreamerCentral.instances[streamName]) {
    const streamer = new Meteor.Streamer(streamName);
    streamer.allowRead('all');
    streamer.allowWrite('none');
    streamer.allowEmit(allowRecentMessages);
    Logger.info("Created External Video streamer for ".concat(streamName));
  } else {
    Logger.debug("External Video streamer is already created for ".concat(streamName));
  }
}

function get(meetingId) {
  const streamName = "external-videos-".concat(meetingId);
  return Meteor.StreamerCentral.instances[streamName];
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"group-chat":{"server":{"handlers":{"groupChatCreated.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/handlers/groupChatCreated.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGroupChatCreated
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addGroupChat;
module.link("../modifiers/addGroupChat", {
  default(v) {
    addGroupChat = v;
  }

}, 1);

function handleGroupChatCreated(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(meetingId, String);
  check(body, Object);
  addGroupChat(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groupChatDestroyed.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/handlers/groupChatDestroyed.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGroupChatDestroyed
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addGroupChat;
module.link("../modifiers/addGroupChat", {
  default(v) {
    addGroupChat = v;
  }

}, 1);

function handleGroupChatDestroyed(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(meetingId, String);
  check(body, Object);
  addGroupChat(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groupChats.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/handlers/groupChats.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGroupChats
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addGroupChat;
module.link("../modifiers/addGroupChat", {
  default(v) {
    addGroupChat = v;
  }

}, 1);

function handleGroupChats(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    chats
  } = body;
  check(meetingId, String);
  check(chats, Array);
  chats.forEach(chat => addGroupChat(meetingId, chat));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"createGroupChat.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/methods/createGroupChat.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => createGroupChat
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let CHAT_ACCESS_PRIVATE;
module.link("/imports/api/group-chat", {
  CHAT_ACCESS_PRIVATE(v) {
    CHAT_ACCESS_PRIVATE = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function createGroupChat(receiver) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'CreateGroupChatReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(receiver, Object);
  const payload = {
    correlationId: "".concat(requesterUserId, "-").concat(Date.now()),
    msg: [],
    users: [receiver.userId],
    access: CHAT_ACCESS_PRIVATE,
    name: receiver.name
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"destroyGroupChat.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/methods/destroyGroupChat.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => destroyGroupChat
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function destroyGroupChat() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const eventName = 'DestroyGroupChatReqMsg';
  const payload = {// TODO: Implement this together with #4988
    // chats: Array[String],
  };
  return RedisPubSub.publishUserMessage(CHANNEL, eventName, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addGroupChat.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/modifiers/addGroupChat.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addGroupChat
});
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 0);
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let GroupChat;
module.link("/imports/api/group-chat", {
  default(v) {
    GroupChat = v;
  }

}, 3);

function addGroupChat(meetingId, chat) {
  check(meetingId, String);
  check(chat, {
    id: Match.Maybe(String),
    chatId: Match.Maybe(String),
    correlationId: Match.Maybe(String),
    name: String,
    access: String,
    createdBy: Object,
    users: Array,
    msg: Match.Maybe(Array)
  });
  const chatDocument = {
    meetingId,
    chatId: chat.chatId || chat.id,
    name: chat.name,
    access: chat.access,
    users: chat.users.map(u => u.id),
    participants: chat.users,
    createdBy: chat.createdBy.id
  };
  const selector = {
    chatId: chatDocument.chatId,
    meetingId
  };
  const modifier = {
    $set: flat(chatDocument, {
      safe: true
    })
  };

  try {
    const {
      insertedId
    } = GroupChat.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added group-chat name=".concat(chat.name, " meetingId=").concat(meetingId));
    } else {
      Logger.info("Upserted group-chat name=".concat(chat.name, " meetingId=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding group-chat to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearGroupChat.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/modifiers/clearGroupChat.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearGroupChat
});
let GroupChat;
module.link("/imports/api/group-chat", {
  default(v) {
    GroupChat = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let clearGroupChatMsg;
module.link("/imports/api/group-chat-msg/server/modifiers/clearGroupChatMsg", {
  default(v) {
    clearGroupChatMsg = v;
  }

}, 2);

function clearGroupChat(meetingId) {
  try {
    clearGroupChatMsg(meetingId);
    const numberAffected = GroupChat.remove({
      meetingId
    });

    if (numberAffected) {
      Logger.info("Cleared GroupChat (".concat(meetingId, ")"));
    }
  } catch (err) {
    Logger.error("Error on clearing GroupChat (".concat(meetingId, "). ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/eventHandlers.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleGroupChats;
module.link("./handlers/groupChats", {
  default(v) {
    handleGroupChats = v;
  }

}, 1);
let handleGroupChatCreated;
module.link("./handlers/groupChatCreated", {
  default(v) {
    handleGroupChatCreated = v;
  }

}, 2);
let handleGroupChatDestroyed;
module.link("./handlers/groupChatDestroyed", {
  default(v) {
    handleGroupChatDestroyed = v;
  }

}, 3);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 4);
RedisPubSub.on('GetGroupChatsRespMsg', processForHTML5ServerOnly(handleGroupChats));
RedisPubSub.on('GroupChatCreatedEvtMsg', handleGroupChatCreated);
RedisPubSub.on('GroupChatDestroyedEvtMsg', handleGroupChatDestroyed);
RedisPubSub.on('SyncGetGroupChatsRespMsg', handleGroupChats);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/index.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("/imports/api/group-chat-msg/server");
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/methods.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let createGroupChat;
module.link("./methods/createGroupChat", {
  default(v) {
    createGroupChat = v;
  }

}, 1);
let destroyGroupChat;
module.link("./methods/destroyGroupChat", {
  default(v) {
    destroyGroupChat = v;
  }

}, 2);
Meteor.methods({
  createGroupChat,
  destroyGroupChat
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/server/publishers.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let GroupChat;
module.link("/imports/api/group-chat", {
  default(v) {
    GroupChat = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function groupChat() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing GroupChat was requested by unauth connection ".concat(this.connection.id));
    return GroupChat.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  const CHAT_CONFIG = Meteor.settings.public.chat;
  const PUBLIC_CHAT_TYPE = CHAT_CONFIG.type_public;
  Logger.debug('Publishing group-chat', {
    meetingId,
    userId
  });
  return GroupChat.find({
    $or: [{
      meetingId,
      access: PUBLIC_CHAT_TYPE
    }, {
      meetingId,
      users: {
        $all: [userId]
      }
    }]
  });
}

function publish() {
  const boundGroupChat = groupChat.bind(this);
  return boundGroupChat(...arguments);
}

Meteor.publish('group-chat', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat/index.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CHAT_ACCESS_PUBLIC: () => CHAT_ACCESS_PUBLIC,
  CHAT_ACCESS_PRIVATE: () => CHAT_ACCESS_PRIVATE
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const GroupChat = new Mongo.Collection('group-chat');

if (Meteor.isServer) {
  GroupChat._ensureIndex({
    meetingId: 1,
    chatId: 1,
    access: 1,
    users: 1
  });
}

module.exportDefault(GroupChat);
const CHAT_ACCESS = {
  PUBLIC: 'PUBLIC_ACCESS',
  PRIVATE: 'PRIVATE_ACCESS'
};
const CHAT_ACCESS_PUBLIC = CHAT_ACCESS.PUBLIC;
const CHAT_ACCESS_PRIVATE = CHAT_ACCESS.PRIVATE;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"group-chat-msg":{"server":{"handlers":{"clearPublicGroupChat.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/handlers/clearPublicGroupChat.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearPublicChatHistory
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let clearGroupChatMsg;
module.link("../modifiers/clearGroupChatMsg", {
  default(v) {
    clearGroupChatMsg = v;
  }

}, 1);

function clearPublicChatHistory(_ref) {
  let {
    header,
    body
  } = _ref;
  const {
    meetingId
  } = header;
  const {
    chatId
  } = body;
  check(meetingId, String);
  check(chatId, String);
  return clearGroupChatMsg(meetingId, chatId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groupChatMsgBroadcast.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/handlers/groupChatMsgBroadcast.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGroupChatMsgBroadcast
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 1);
let addGroupChatMsg;
module.link("../modifiers/addGroupChatMsg", {
  default(v) {
    addGroupChatMsg = v;
  }

}, 2);
let addBulkGroupChatMsgs;
module.link("../modifiers/addBulkGroupChatMsgs", {
  default(v) {
    addBulkGroupChatMsgs = v;
  }

}, 3);
const {
  bufferChatInsertsMs
} = Meteor.settings.public.chat;
const msgBuffer = [];

const bulkFn = _.throttle(addBulkGroupChatMsgs, bufferChatInsertsMs);

function handleGroupChatMsgBroadcast(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    chatId,
    msg
  } = body;
  check(meetingId, String);
  check(chatId, String);
  check(msg, Object);

  if (bufferChatInsertsMs) {
    msgBuffer.push({
      meetingId,
      chatId,
      msg
    });
    bulkFn(msgBuffer);
  } else {
    addGroupChatMsg(meetingId, chatId, msg);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"syncGroupsChat.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/handlers/syncGroupsChat.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleSyncGroupChat
});
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 0);
let syncMeetingChatMsgs;
module.link("../modifiers/syncMeetingChatMsgs", {
  default(v) {
    syncMeetingChatMsgs = v;
  }

}, 1);

function handleSyncGroupChat(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    chatId,
    msgs
  } = body;
  check(meetingId, String);
  check(chatId, String);
  check(msgs, Match.Maybe(Array));
  syncMeetingChatMsgs(meetingId, chatId, msgs);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userTyping.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/handlers/userTyping.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUserTyping
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let startTyping;
module.link("../modifiers/startTyping", {
  default(v) {
    startTyping = v;
  }

}, 1);

function handleUserTyping(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    chatId,
    userId
  } = body;
  check(meetingId, String);
  check(userId, String);
  check(chatId, String);
  startTyping(meetingId, userId, chatId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"chatMessageBeforeJoinCounter.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods/chatMessageBeforeJoinCounter.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => chatMessageBeforeJoinCounter
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let GroupChat;
module.link("/imports/api/group-chat", {
  default(v) {
    GroupChat = v;
  }

}, 2);
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 3);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 4);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 5);
const CHAT_CONFIG = Meteor.settings.public.chat;
const PUBLIC_CHAT_TYPE = CHAT_CONFIG.type_public;

function chatMessageBeforeJoinCounter() {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const groupChats = GroupChat.find({
    $or: [{
      meetingId,
      access: PUBLIC_CHAT_TYPE
    }, {
      meetingId,
      users: {
        $all: [requesterUserId]
      }
    }]
  }).fetch();
  const User = Users.findOne({
    userId: requesterUserId,
    meetingId
  });
  const chatIdWithCounter = groupChats.map(groupChat => {
    const msgCount = GroupChatMsg.find({
      chatId: groupChat.chatId,
      timestamp: {
        $lt: User.authTokenValidatedTime
      }
    }).count();
    return {
      chatId: groupChat.chatId,
      count: msgCount
    };
  }).filter(chat => chat.count);
  return chatIdWithCounter;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearPublicChatHistory.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods/clearPublicChatHistory.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearPublicChatHistory
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function clearPublicChatHistory() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ClearPublicChatHistoryPubMsg';
  const CHAT_CONFIG = Meteor.settings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const payload = {
    chatId: PUBLIC_GROUP_CHAT_ID
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fetchMessagePerPage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods/fetchMessagePerPage.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => fetchMessagePerPage
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let GroupChat;
module.link("/imports/api/group-chat", {
  default(v) {
    GroupChat = v;
  }

}, 1);
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 2);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
const CHAT_CONFIG = Meteor.settings.public.chat;
const ITENS_PER_PAGE = CHAT_CONFIG.itemsPerPage;

function fetchMessagePerPage(chatId, page) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const User = Users.findOne({
    userId: requesterUserId,
    meetingId
  });
  const messages = GroupChatMsg.find({
    chatId,
    meetingId,
    timestamp: {
      $lt: User.authTokenValidatedTime
    }
  }, {
    sort: {
      timestamp: 1
    },
    skip: page > 0 ? (page - 1) * ITENS_PER_PAGE : 0,
    limit: ITENS_PER_PAGE
  }).fetch();
  return messages;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendGroupChatMsg.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods/sendGroupChatMsg.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => sendGroupChatMsg
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let RegexWebUrl;
module.link("/imports/utils/regex-weburl", {
  default(v) {
    RegexWebUrl = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
const HTML_SAFE_MAP = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const parseMessage = message => {
  let parsedMessage = message || '';
  parsedMessage = parsedMessage.trim(); // Replace <br/> with \n\r

  parsedMessage = parsedMessage.replace(/<br\s*[\\/]?>/gi, '\n\r'); // Sanitize. See: http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/

  parsedMessage = parsedMessage.replace(/[<>'"]/g, c => HTML_SAFE_MAP[c]); // Replace flash links to flash valid ones

  parsedMessage = parsedMessage.replace(RegexWebUrl, "<a href='event:$&'><u>$&</u></a>");
  return parsedMessage;
};

function sendGroupChatMsg(chatId, message) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SendGroupChatMessageMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(message, Object);
  const parsedMessage = parseMessage(message.message);
  message.message = parsedMessage;
  const payload = {
    msg: message,
    chatId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startUserTyping.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods/startUserTyping.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => startUserTyping
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function startUserTyping(chatId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserTypingPubMsg';
  const CHAT_CONFIG = Meteor.settings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(chatId, String);
  const payload = {
    chatId: chatId || PUBLIC_GROUP_CHAT_ID
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stopUserTyping.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods/stopUserTyping.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => stopUserTyping
});
let UsersTyping;
module.link("/imports/api/group-chat-msg", {
  UsersTyping(v) {
    UsersTyping = v;
  }

}, 0);
let stopTyping;
module.link("../modifiers/stopTyping", {
  default(v) {
    stopTyping = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function stopUserTyping() {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const userTyping = UsersTyping.findOne({
    meetingId,
    userId: requesterUserId
  });

  if (userTyping && meetingId && requesterUserId) {
    stopTyping(meetingId, requesterUserId, true);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addBulkGroupChatMsgs.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/addBulkGroupChatMsgs.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  default: () => addBulkGroupChatMsgs
});
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 2);
let parseMessage;
module.link("./addGroupChatMsg", {
  parseMessage(v) {
    parseMessage = v;
  }

}, 3);

function addBulkGroupChatMsgs(msgs) {
  return Promise.asyncApply(() => {
    if (!msgs.length) return;
    const mappedMsgs = msgs.map((_ref) => {
      let {
        chatId,
        meetingId,
        msg
      } = _ref;
      return _objectSpread({
        _id: new Mongo.ObjectID()._str
      }, msg, {
        meetingId,
        chatId,
        message: parseMessage(msg.message),
        sender: msg.sender.id
      });
    }).map(el => flat(el, {
      safe: true
    }));

    try {
      const {
        insertedCount
      } = Promise.await(GroupChatMsg.rawCollection().insertMany(mappedMsgs));
      msgs.length = 0;

      if (insertedCount) {
        Logger.info("Inserted ".concat(insertedCount, " messages"));
      }
    } catch (err) {
      Logger.error("Error on bulk insert. ".concat(err));
    }
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addGroupChatMsg.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/addGroupChatMsg.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  parseMessage: () => parseMessage,
  default: () => addGroupChatMsg
});
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 0);
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 3);
let BREAK_LINE;
module.link("/imports/utils/lineEndings", {
  BREAK_LINE(v) {
    BREAK_LINE = v;
  }

}, 4);

function parseMessage(message) {
  let parsedMessage = message || ''; // Replace \r and \n to <br/>

  parsedMessage = parsedMessage.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1".concat(BREAK_LINE, "$2")); // Replace flash links to html valid ones

  parsedMessage = parsedMessage.split('<a href=\'event:').join('<a target="_blank" href=\'');
  parsedMessage = parsedMessage.split('<a href="event:').join('<a target="_blank" href="');
  return parsedMessage;
}

function addGroupChatMsg(meetingId, chatId, msg) {
  check(meetingId, String);
  check(chatId, String);
  check(msg, {
    id: Match.Maybe(String),
    timestamp: Number,
    sender: Object,
    color: String,
    message: String,
    correlationId: Match.Maybe(String)
  });

  const msgDocument = _objectSpread({}, msg, {
    meetingId,
    chatId,
    message: parseMessage(msg.message)
  });

  try {
    const insertedId = GroupChatMsg.insert(msgDocument);

    if (insertedId) {
      Logger.info("Added group-chat-msg msgId=".concat(msg.id, " chatId=").concat(chatId, " meetingId=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Error on adding group-chat-msg to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addSystemMsg.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/addSystemMsg.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  parseMessage: () => parseMessage,
  default: () => addSystemMsg
});
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 2);
let BREAK_LINE;
module.link("/imports/utils/lineEndings", {
  BREAK_LINE(v) {
    BREAK_LINE = v;
  }

}, 3);

function parseMessage(message) {
  let parsedMessage = message || ''; // Replace \r and \n to <br/>

  parsedMessage = parsedMessage.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1".concat(BREAK_LINE, "$2")); // Replace flash links to html valid ones

  parsedMessage = parsedMessage.split('<a href=\'event:').join('<a target="_blank" href=\'');
  parsedMessage = parsedMessage.split('<a href="event:').join('<a target="_blank" href="');
  return parsedMessage;
}

function addSystemMsg(meetingId, chatId, msg) {
  check(meetingId, String);
  check(chatId, String);
  check(msg, {
    id: Match.Maybe(String),
    timestamp: Number,
    sender: Object,
    message: String,
    correlationId: Match.Maybe(String)
  });

  const msgDocument = _objectSpread({}, msg, {
    meetingId,
    chatId,
    message: parseMessage(msg.message)
  });

  try {
    const insertedId = GroupChatMsg.insert(msgDocument);

    if (insertedId) {
      Logger.info("Added system-msg msgId=".concat(msg.id, " chatId=").concat(chatId, " meetingId=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Error on adding system-msg to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearGroupChatMsg.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/clearGroupChatMsg.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearGroupChatMsg
});
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let addGroupChatMsg;
module.link("/imports/api/group-chat-msg/server/modifiers/addGroupChatMsg", {
  default(v) {
    addGroupChatMsg = v;
  }

}, 2);

function clearGroupChatMsg(meetingId, chatId) {
  const CHAT_CONFIG = Meteor.settings.public.chat;
  const PUBLIC_CHAT_SYSTEM_ID = CHAT_CONFIG.system_userid;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  const CHAT_CLEAR_MESSAGE = CHAT_CONFIG.system_messages_keys.chat_clear;
  const SYSTEM_CHAT_TYPE = CHAT_CONFIG.type_system;

  if (chatId) {
    try {
      const numberAffected = GroupChatMsg.remove({
        meetingId,
        chatId
      });

      if (numberAffected) {
        Logger.info("Cleared GroupChatMsg (".concat(meetingId, ", ").concat(chatId, ")"));
        const clearMsg = {
          id: "".concat(SYSTEM_CHAT_TYPE, "-").concat(CHAT_CLEAR_MESSAGE),
          color: '0',
          timestamp: Date.now(),
          correlationId: "".concat(PUBLIC_CHAT_SYSTEM_ID, "-").concat(Date.now()),
          sender: {
            id: PUBLIC_CHAT_SYSTEM_ID,
            name: ''
          },
          message: CHAT_CLEAR_MESSAGE
        };
        addGroupChatMsg(meetingId, PUBLIC_GROUP_CHAT_ID, clearMsg);
      }
    } catch (err) {
      Logger.error("Error on clearing GroupChat (".concat(meetingId, ", ").concat(chatId, "). ").concat(err));
    }

    return true;
  }

  if (meetingId) {
    try {
      const numberAffected = GroupChatMsg.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared GroupChatMsg (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing GroupChatMsg (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = GroupChatMsg.remove({
        chatId: {
          $eq: PUBLIC_GROUP_CHAT_ID
        }
      });

      if (numberAffected) {
        Logger.info('Cleared GroupChatMsg (all)');
      }
    } catch (err) {
      Logger.error("Error on clearing GroupChatMsg (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startTyping.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/startTyping.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => startTyping
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let UsersTyping;
module.link("/imports/api/group-chat-msg", {
  UsersTyping(v) {
    UsersTyping = v;
  }

}, 3);
let stopTyping;
module.link("./stopTyping", {
  default(v) {
    stopTyping = v;
  }

}, 4);
const TYPING_TIMEOUT = 5000;

function startTyping(meetingId, userId, chatId) {
  check(meetingId, String);
  check(userId, String);
  const selector = {
    meetingId,
    userId
  };
  const user = Users.findOne(selector, {
    fields: {
      name: 1,
      role: 1
    }
  });
  const modifier = {
    meetingId,
    userId,
    name: user.name,
    isTypingTo: chatId,
    role: user.role,
    time: new Date()
  };
  const typingUser = UsersTyping.findOne(selector, {
    fields: {
      time: 1
    }
  });

  if (typingUser) {
    if (modifier.time - typingUser.time <= TYPING_TIMEOUT - 100) return;
  }

  try {
    const {
      numberAffected
    } = UsersTyping.upsert(selector, modifier);

    if (numberAffected) {
      Logger.debug('Typing indicator update', {
        userId,
        chatId
      });
      Meteor.setTimeout(() => {
        stopTyping(meetingId, userId);
      }, TYPING_TIMEOUT);
    }
  } catch (err) {
    Logger.error("Typing indicator update error: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stopTyping.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/stopTyping.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => stopTyping
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let UsersTyping;
module.link("/imports/api/group-chat-msg", {
  UsersTyping(v) {
    UsersTyping = v;
  }

}, 2);

function stopTyping(meetingId, userId) {
  let sendMsgInitiated = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  check(meetingId, String);
  check(userId, String);
  check(sendMsgInitiated, Boolean);
  const selector = {
    meetingId,
    userId
  };
  const user = UsersTyping.findOne(selector);
  const stillTyping = !sendMsgInitiated && user && new Date() - user.time < 3000;
  if (stillTyping) return;

  try {
    const numberAffected = UsersTyping.remove(selector);

    if (numberAffected) {
      Logger.debug('Stopped typing indicator', {
        userId
      });
    }
  } catch (err) {
    Logger.error("Stop user=".concat(userId, " typing indicator error: ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"syncMeetingChatMsgs.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/modifiers/syncMeetingChatMsgs.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  default: () => syncMeetingChatMsgs
});
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 0);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 1);
let GroupChatMsg;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let parseMessage;
module.link("./addGroupChatMsg", {
  parseMessage(v) {
    parseMessage = v;
  }

}, 4);

function syncMeetingChatMsgs(meetingId, chatId, msgs) {
  if (!msgs.length) return;
  check(meetingId, String);
  check(chatId, String);
  check(msgs, Match.Maybe(Array));

  try {
    const bulkOperations = GroupChatMsg.rawCollection().initializeOrderedBulkOp();
    msgs.forEach(msg => {
      const msgToSync = _objectSpread({}, msg, {
        meetingId,
        chatId,
        message: parseMessage(msg.message),
        sender: msg.sender.id
      });

      const modifier = flat(msgToSync, {
        safe: true
      });
      bulkOperations.find({
        chatId,
        meetingId,
        id: msg.id
      }).upsert().updateOne({
        $setOnInsert: {
          _id: new Mongo.ObjectID()._str
        },
        $set: _objectSpread({}, modifier)
      });
    });
    bulkOperations.execute();
    Logger.info('Chat messages synchronized', {
      chatId,
      meetingId
    });
  } catch (err) {
    Logger.error("Error on sync chat messages: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/eventHandlers.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleGroupChatMsgBroadcast;
module.link("./handlers/groupChatMsgBroadcast", {
  default(v) {
    handleGroupChatMsgBroadcast = v;
  }

}, 1);
let handleClearPublicGroupChat;
module.link("./handlers/clearPublicGroupChat", {
  default(v) {
    handleClearPublicGroupChat = v;
  }

}, 2);
let handleUserTyping;
module.link("./handlers/userTyping", {
  default(v) {
    handleUserTyping = v;
  }

}, 3);
let handleSyncGroupChatMsg;
module.link("./handlers/syncGroupsChat", {
  default(v) {
    handleSyncGroupChatMsg = v;
  }

}, 4);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 5);
RedisPubSub.on('GetGroupChatMsgsRespMsg', processForHTML5ServerOnly(handleSyncGroupChatMsg));
RedisPubSub.on('GroupChatMessageBroadcastEvtMsg', handleGroupChatMsgBroadcast);
RedisPubSub.on('ClearPublicChatHistoryEvtMsg', handleClearPublicGroupChat);
RedisPubSub.on('SyncGetGroupChatMsgsRespMsg', handleSyncGroupChatMsg);
RedisPubSub.on('UserTypingEvtMsg', handleUserTyping);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/methods.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let sendGroupChatMsg;
module.link("./methods/sendGroupChatMsg", {
  default(v) {
    sendGroupChatMsg = v;
  }

}, 1);
let clearPublicChatHistory;
module.link("./methods/clearPublicChatHistory", {
  default(v) {
    clearPublicChatHistory = v;
  }

}, 2);
let startUserTyping;
module.link("./methods/startUserTyping", {
  default(v) {
    startUserTyping = v;
  }

}, 3);
let stopUserTyping;
module.link("./methods/stopUserTyping", {
  default(v) {
    stopUserTyping = v;
  }

}, 4);
let chatMessageBeforeJoinCounter;
module.link("./methods/chatMessageBeforeJoinCounter", {
  default(v) {
    chatMessageBeforeJoinCounter = v;
  }

}, 5);
let fetchMessagePerPage;
module.link("./methods/fetchMessagePerPage", {
  default(v) {
    fetchMessagePerPage = v;
  }

}, 6);
Meteor.methods({
  fetchMessagePerPage,
  chatMessageBeforeJoinCounter,
  sendGroupChatMsg,
  clearPublicChatHistory,
  startUserTyping,
  stopUserTyping
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/server/publishers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let GroupChatMsg, UsersTyping;
module.link("/imports/api/group-chat-msg", {
  GroupChatMsg(v) {
    GroupChatMsg = v;
  },

  UsersTyping(v) {
    UsersTyping = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 4);

function groupChatMsg(chatsIds) {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing GroupChatMsg was requested by unauth connection ".concat(this.connection.id));
    return GroupChatMsg.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  const CHAT_CONFIG = Meteor.settings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  Logger.debug('Publishing group-chat-msg', {
    meetingId,
    userId
  });
  const User = Users.findOne({
    userId
  });
  const selector = {
    timestamp: {
      $gte: User.authTokenValidatedTime
    },
    $or: [{
      meetingId,
      chatId: {
        $eq: PUBLIC_GROUP_CHAT_ID
      }
    }, {
      chatId: {
        $in: chatsIds
      }
    }]
  };
  return GroupChatMsg.find(selector);
}

function publish() {
  const boundGroupChat = groupChatMsg.bind(this);
  return boundGroupChat(...arguments);
}

Meteor.publish('group-chat-msg', publish);

function usersTyping() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing users-typing was requested by unauth connection ".concat(this.connection.id));
    return UsersTyping.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing users-typing', {
    meetingId,
    userId
  });
  return UsersTyping.find({
    meetingId
  });
}

function pubishUsersTyping() {
  const boundUsersTyping = usersTyping.bind(this);
  return boundUsersTyping(...arguments);
}

Meteor.publish('users-typing', pubishUsersTyping);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/group-chat-msg/index.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  GroupChatMsg: () => GroupChatMsg,
  UsersTyping: () => UsersTyping
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const GroupChatMsg = new Mongo.Collection('group-chat-msg');
const UsersTyping = new Mongo.Collection('users-typing');

if (Meteor.isServer) {
  GroupChatMsg._ensureIndex({
    meetingId: 1,
    chatId: 1
  });

  UsersTyping._ensureIndex({
    meetingId: 1,
    isTypingTo: 1
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"guest-users":{"server":{"handlers":{"guestApproved.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/handlers/guestApproved.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGuestApproved
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let setGuestStatus;
module.link("../modifiers/setGuestStatus", {
  default(v) {
    setGuestStatus = v;
  }

}, 1);

function handleGuestApproved(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    approvedBy,
    guests
  } = body;
  check(meetingId, String);
  check(approvedBy, String);
  check(guests, Array);
  return guests.forEach(guest => setGuestStatus(meetingId, guest.guest, guest.status, approvedBy));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"guestWaitingLeft.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/handlers/guestWaitingLeft.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGuestWaitingLeft
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removeGuest;
module.link("../modifiers/removeGuest", {
  default(v) {
    removeGuest = v;
  }

}, 1);

function handleGuestWaitingLeft(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    userId
  } = body;
  check(meetingId, String);
  check(userId, String);
  return removeGuest(meetingId, userId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"guestsWaitingForApproval.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/handlers/guestsWaitingForApproval.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  default: () => handleGuestsWaitingForApproval
});
let stringHash;
module.link("string-hash", {
  default(v) {
    stringHash = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let GuestUsers;
module.link("/imports/api/guest-users/", {
  default(v) {
    GuestUsers = v;
  }

}, 3);
const COLOR_LIST = ['#7b1fa2', '#6a1b9a', '#4a148c', '#5e35b1', '#512da8', '#4527a0', '#311b92', '#3949ab', '#303f9f', '#283593', '#1a237e', '#1976d2', '#1565c0', '#0d47a1', '#0277bd', '#01579b'];

function handleGuestsWaitingForApproval(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    guests
  } = body;
  check(guests, Array);
  check(meetingId, String);
  return guests.map(guest => {
    try {
      const {
        insertedId,
        numberAffected
      } = GuestUsers.upsert({
        meetingId,
        intId: guest.intId
      }, _objectSpread({
        approved: false,
        denied: false
      }, guest, {
        meetingId,
        loginTime: guest.registeredOn,
        color: COLOR_LIST[stringHash(guest.intId) % COLOR_LIST.length]
      }));

      if (insertedId) {
        Logger.info("Added guest user meeting=".concat(meetingId));
      } else if (numberAffected) {
        Logger.info("Upserted guest user meeting=".concat(meetingId));
      }
    } catch (err) {
      Logger.error("Adding guest user to collection: ".concat(err));
    }
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"allowPendingUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/methods/allowPendingUsers.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => allowPendingUsers
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
const REDIS_CONFIG = Meteor.settings.private.redis;
const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
const EVENT_NAME = 'GuestsWaitingApprovedMsg';

function allowPendingUsers(guests, status) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(guests, Array);
  const mappedGuests = guests.map(guest => ({
    status,
    guest: guest.intId
  }));
  const payload = {
    approvedBy: requesterUserId,
    guests: mappedGuests
  };
  Logger.info("User=".concat(requesterUserId, " ").concat(status, " guests ").concat(JSON.stringify(mappedGuests)));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeGuestPolicy.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/methods/changeGuestPolicy.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeGuestPolicy
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
const REDIS_CONFIG = Meteor.settings.private.redis;
const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
const EVENT_NAME = 'SetGuestPolicyCmdMsg';

function changeGuestPolicy(policyRule) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(policyRule, String);
  const payload = {
    setBy: requesterUserId,
    policy: policyRule
  };
  Logger.info("User=".concat(requesterUserId, " change guest policy to ").concat(policyRule));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setGuestLobbyMessage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/methods/setGuestLobbyMessage.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setGuestLobbyMessage
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
const REDIS_CONFIG = Meteor.settings.private.redis;
const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
const EVENT_NAME = 'SetGuestLobbyMessageCmdMsg';

function setGuestLobbyMessage(message) {
  check(message, String);
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(meetingId, String);
  check(requesterUserId, String);
  const payload = {
    message
  };
  Logger.info("User=".concat(requesterUserId, " set guest lobby message to ").concat(message));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearGuestUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/modifiers/clearGuestUsers.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearGuestUsers
});
let GuestUsers;
module.link("/imports/api/guest-users", {
  default(v) {
    GuestUsers = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearGuestUsers(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = GuestUsers.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared GuestUsers in (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.info("Error on clearing GuestUsers in (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = GuestUsers.remove({});

      if (numberAffected) {
        Logger.info('Cleared GuestUsers in all meetings');
      }
    } catch (err) {
      Logger.error("Error on clearing GuestUsers in all meetings. ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeGuest.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/modifiers/removeGuest.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removeGuest
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let GuestUsers;
module.link("/imports/api/guest-users", {
  default(v) {
    GuestUsers = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function removeGuest(meetingId, intId) {
  check(meetingId, String);
  check(intId, String);
  const selector = {
    meetingId,
    intId
  };

  const cb = err => {
    if (err) {
      return Logger.error("Removing guest user from collection: ".concat(err));
    }

    return Logger.info("Removed guest user id=".concat(intId, " meetingId=").concat(meetingId));
  };

  return GuestUsers.remove(selector, cb);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setGuestStatus.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/modifiers/setGuestStatus.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setGuestStatus
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let GuestUsers;
module.link("/imports/api/guest-users", {
  default(v) {
    GuestUsers = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
const GUEST_STATUS_ALLOW = 'ALLOW';
const GUEST_STATUS_DENY = 'DENY';

function setGuestStatus(meetingId, intId, status) {
  let approvedBy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  check(meetingId, String);
  check(intId, String);
  check(status, String);
  const selector = {
    meetingId,
    intId
  };
  const modifier = {
    $set: {
      approved: status === GUEST_STATUS_ALLOW,
      denied: status === GUEST_STATUS_DENY,
      approvedBy
    }
  };

  try {
    const numberAffected = GuestUsers.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Updated status=".concat(status, " user=").concat(intId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Updating status=".concat(status, " user=").concat(intId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/eventHandlers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 1);
let handleGuestApproved;
module.link("./handlers/guestApproved", {
  default(v) {
    handleGuestApproved = v;
  }

}, 2);
let handleGuestsWaitingForApproval;
module.link("./handlers/guestsWaitingForApproval", {
  default(v) {
    handleGuestsWaitingForApproval = v;
  }

}, 3);
let handleGuestWaitingLeft;
module.link("./handlers/guestWaitingLeft", {
  default(v) {
    handleGuestWaitingLeft = v;
  }

}, 4);
RedisPubSub.on('GuestWaitingLeftEvtMsg', handleGuestWaitingLeft);
RedisPubSub.on('GuestsWaitingForApprovalEvtMsg', processForHTML5ServerOnly(handleGuestsWaitingForApproval));
RedisPubSub.on('GuestsWaitingApprovedEvtMsg', processForHTML5ServerOnly(handleGuestApproved));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/index.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/methods.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let allowPendingUsers;
module.link("/imports/api/guest-users/server/methods/allowPendingUsers", {
  default(v) {
    allowPendingUsers = v;
  }

}, 1);
let changeGuestPolicy;
module.link("/imports/api/guest-users/server/methods/changeGuestPolicy", {
  default(v) {
    changeGuestPolicy = v;
  }

}, 2);
let setGuestLobbyMessage;
module.link("/imports/api/guest-users/server/methods/setGuestLobbyMessage", {
  default(v) {
    setGuestLobbyMessage = v;
  }

}, 3);
Meteor.methods({
  allowPendingUsers,
  changeGuestPolicy,
  setGuestLobbyMessage
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/server/publishers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let GuestUsers;
module.link("/imports/api/guest-users/", {
  default(v) {
    GuestUsers = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function guestUsers() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing GuestUsers was requested by unauth connection ".concat(this.connection.id));
    return GuestUsers.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug("Publishing GuestUsers for ".concat(meetingId, " ").concat(userId));
  return GuestUsers.find({
    meetingId
  });
}

function publish() {
  const boundSlides = guestUsers.bind(this);
  return boundSlides(...arguments);
}

Meteor.publish('guestUser', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/guest-users/index.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 1);
const GuestUsers = new Mongo.Collection('guestUsers');
module.exportDefault(GuestUsers);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"local-settings":{"server":{"methods":{"userChangedLocalSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/server/methods/userChangedLocalSettings.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userChangedLocalSettings
});

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let LocalSettings;
module.link("/imports/api/local-settings", {
  default(v) {
    LocalSettings = v;
  }

}, 2);
let setChangedLocalSettings;
module.link("../modifiers/setChangedLocalSettings", {
  default(v) {
    setChangedLocalSettings = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function userChangedLocalSettings(settings) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  if (!meetingId || !requesterUserId) return;
  check(settings, Object);
  const userLocalSettings = LocalSettings.findOne({
    meetingId,
    userId: requesterUserId
  }, {
    fields: {
      settings: 1
    }
  });

  if (!userLocalSettings || !_.isEqual(userLocalSettings.settings, settings)) {
    setChangedLocalSettings(meetingId, requesterUserId, settings);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearLocalSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/server/modifiers/clearLocalSettings.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearLocalSettings
});
let LocalSettings;
module.link("/imports/api/local-settings", {
  default(v) {
    LocalSettings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearLocalSettings(meetingId) {
  try {
    const numberAffected = LocalSettings.remove({
      meetingId
    });

    if (numberAffected) {
      Logger.info("Cleared Local Settings (".concat(meetingId, ")"));
    }
  } catch (err) {
    Logger.error("Error on clearing Local Settings (".concat(meetingId, "). ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setChangedLocalSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/server/modifiers/setChangedLocalSettings.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setChangedLocalSettings
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let LocalSettings;
module.link("/imports/api/local-settings", {
  default(v) {
    LocalSettings = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function setChangedLocalSettings(meetingId, userId, settings) {
  check(meetingId, String);
  check(userId, String);
  check(settings, Object);
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      settings
    }
  };

  try {
    const {
      numChanged
    } = LocalSettings.upsert(selector, modifier);

    if (numChanged) {
      Logger.info("Updated settings for user ".concat(userId, " on meeting ").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Error on update settings. ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/server/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/server/methods.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let userChangedLocalSettings;
module.link("./methods/userChangedLocalSettings", {
  default(v) {
    userChangedLocalSettings = v;
  }

}, 1);
Meteor.methods({
  userChangedLocalSettings
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/server/publishers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let LocalSettings;
module.link("/imports/api/local-settings", {
  default(v) {
    LocalSettings = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function localSettings() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing LocalSettings was requested by unauth connection ".concat(this.connection.id));
    return LocalSettings.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing local settings', {
    userId
  });
  return LocalSettings.find({
    meetingId,
    userId
  });
}

function publish() {
  const boundLocalSettings = localSettings.bind(this);
  return boundLocalSettings(...arguments);
}

Meteor.publish('local-settings', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/local-settings/index.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const LocalSettings = new Mongo.Collection('local-settings');

if (Meteor.isServer) {
  LocalSettings._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

module.exportDefault(LocalSettings);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"log-client":{"server":{"methods":{"logClient.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/log-client/server/methods/logClient.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
module.exportDefault(function (type, logDescription) {
  let logCode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'was_not_provided';
  let extraInfo = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  let userInfo = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  const connectionId = this.connection.id;
  const logContents = {
    logCode,
    logDescription,
    connectionId,
    extraInfo,
    userInfo
  }; // If I don't pass message, logs will start with `undefined`

  Logger.log({
    message: JSON.stringify(logContents),
    level: type
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/log-client/server/index.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./methods");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/log-client/server/methods.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let logClient;
module.link("./methods/logClient", {
  default(v) {
    logClient = v;
  }

}, 1);
Meteor.methods({
  logClient
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"meetings":{"server":{"handlers":{"getAllMeetings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/getAllMeetings.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGetAllMeetings
});
let handleMeetingCreation;
module.link("./meetingCreation", {
  default(v) {
    handleMeetingCreation = v;
  }

}, 0);

function handleGetAllMeetings(_ref) {
  let {
    body
  } = _ref;
  return handleMeetingCreation({
    body
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"guestLobbyMessageChanged.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/guestLobbyMessageChanged.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGuestLobbyMessageChanged
});
let setGuestLobbyMessage;
module.link("../modifiers/setGuestLobbyMessage", {
  default(v) {
    setGuestLobbyMessage = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);

function handleGuestLobbyMessageChanged(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    message
  } = body;
  check(meetingId, String);
  check(message, String);
  return setGuestLobbyMessage(meetingId, message);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"guestPolicyChanged.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/guestPolicyChanged.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGuestPolicyChanged
});
let setGuestPolicy;
module.link("../modifiers/setGuestPolicy", {
  default(v) {
    setGuestPolicy = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);

function handleGuestPolicyChanged(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    policy
  } = body;
  check(meetingId, String);
  check(policy, String);
  return setGuestPolicy(meetingId, policy);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"meetingCreation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/meetingCreation.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleMeetingCreation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addMeeting;
module.link("../modifiers/addMeeting", {
  default(v) {
    addMeeting = v;
  }

}, 1);

function handleMeetingCreation(_ref) {
  let {
    body
  } = _ref;
  const meeting = body.props;
  const durationInSecods = meeting.durationProps.duration * 60;
  meeting.durationProps.timeRemaining = durationInSecods;
  check(meeting, Object);
  return addMeeting(meeting);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"meetingDestruction.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/meetingDestruction.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleMeetingDestruction
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let removeAnnotationsStreamer;
module.link("/imports/api/annotations/server/streamer", {
  removeAnnotationsStreamer(v) {
    removeAnnotationsStreamer = v;
  }

}, 2);
let removeCursorStreamer;
module.link("/imports/api/cursor/server/streamer", {
  removeCursorStreamer(v) {
    removeCursorStreamer = v;
  }

}, 3);
let removeExternalVideoStreamer;
module.link("/imports/api/external-videos/server/streamer", {
  removeExternalVideoStreamer(v) {
    removeExternalVideoStreamer = v;
  }

}, 4);

function handleMeetingDestruction(_ref) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    meetingId
  } = body;
  check(meetingId, String);

  if (!process.env.BBB_HTML5_ROLE || process.env.BBB_HTML5_ROLE === 'frontend') {
    removeAnnotationsStreamer(meetingId);
    removeCursorStreamer(meetingId);
    removeExternalVideoStreamer(meetingId);
  }

  return RedisPubSub.destroyMeetingQueue(meetingId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"meetingEnd.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/meetingEnd.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleMeetingEnd
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let meetingHasEnded;
module.link("../modifiers/meetingHasEnded", {
  default(v) {
    meetingHasEnded = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);
let Breakouts;
module.link("/imports/api/breakouts", {
  default(v) {
    Breakouts = v;
  }

}, 3);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 4);

function handleMeetingEnd(_ref) {
  let {
    header,
    body
  } = _ref;
  check(body, Object);
  const {
    meetingId
  } = body;
  check(meetingId, String);
  check(header, Object);
  const {
    userId
  } = header;
  check(userId, String);

  const cb = (err, num, meetingType) => {
    if (err) {
      Logger.error("".concat(meetingType, " ending error: ").concat(err));
      return;
    }

    if (num) {
      Meteor.setTimeout(() => {
        meetingHasEnded(meetingId);
      }, 10000);
    }
  };

  Meetings.update({
    meetingId
  }, {
    $set: {
      meetingEnded: true,
      meetingEndedBy: userId
    }
  }, (err, num) => {
    cb(err, num, 'Meeting');
  });
  Breakouts.update({
    parentMeetingId: meetingId
  }, {
    $set: {
      meetingEnded: true
    }
  }, (err, num) => {
    cb(err, num, 'Breakout');
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"meetingLockChange.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/meetingLockChange.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleLockSettingsInMeeting
});
let changeLockSettings;
module.link("../modifiers/changeLockSettings", {
  default(v) {
    changeLockSettings = v;
  }

}, 0);

function handleLockSettingsInMeeting(_ref, meetingId) {
  let {
    body
  } = _ref;
  changeLockSettings(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"recordingStatusChange.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/recordingStatusChange.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleRecordingStatusChange
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let RecordMeetings;
module.link("/imports/api/meetings", {
  RecordMeetings(v) {
    RecordMeetings = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function handleRecordingStatusChange(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    recording
  } = body;
  check(recording, Boolean);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      recording
    }
  };

  try {
    const {
      numberAffected
    } = RecordMeetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Changed meeting record status id=".concat(meetingId, " recording=").concat(recording));
    }
  } catch (err) {
    Logger.error("Changing record status: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"recordingTimerChange.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/recordingTimerChange.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleRecordingTimerChange
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let RecordMeetings;
module.link("/imports/api/meetings", {
  RecordMeetings(v) {
    RecordMeetings = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function handleRecordingTimerChange(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    time
  } = body;
  check(meetingId, String);
  check(body, {
    time: Number
  });
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      time
    }
  };

  try {
    RecordMeetings.upsert(selector, modifier);
  } catch (err) {
    Logger.error("Changing recording time: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"selectRandomViewer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/selectRandomViewer.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => randomlySelectedUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let updateRandomViewer;
module.link("../modifiers/updateRandomViewer", {
  default(v) {
    updateRandomViewer = v;
  }

}, 1);

function randomlySelectedUser(_ref) {
  let {
    header,
    body
  } = _ref;
  const {
    selectedUserId,
    requestedBy
  } = body;
  const {
    meetingId
  } = header;
  check(meetingId, String);
  check(requestedBy, String);
  check(selectedUserId, String);
  updateRandomViewer(meetingId, selectedUserId, requestedBy);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"timeRemainingUpdate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/timeRemainingUpdate.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleTimeRemainingUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let MeetingTimeRemaining;
module.link("/imports/api/meetings", {
  MeetingTimeRemaining(v) {
    MeetingTimeRemaining = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function handleTimeRemainingUpdate(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(meetingId, String);
  check(body, {
    timeLeftInSec: Number
  });
  const {
    timeLeftInSec
  } = body;
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      timeRemaining: timeLeftInSec
    }
  };

  try {
    MeetingTimeRemaining.upsert(selector, modifier);
  } catch (err) {
    Logger.error("Changing recording time: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userLockChange.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/userLockChange.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleLockSettingsInMeeting
});
let changeUserLock;
module.link("../modifiers/changeUserLock", {
  default(v) {
    changeUserLock = v;
  }

}, 0);

function handleLockSettingsInMeeting(_ref, meetingId) {
  let {
    body
  } = _ref;
  changeUserLock(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webcamOnlyModerator.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/handlers/webcamOnlyModerator.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleChangeWebcamOnlyModerator
});
let changeWebcamOnlyModerator;
module.link("../modifiers/webcamOnlyModerator", {
  default(v) {
    changeWebcamOnlyModerator = v;
  }

}, 0);

function handleChangeWebcamOnlyModerator(_ref, meetingId) {
  let {
    body
  } = _ref;
  changeWebcamOnlyModerator(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"clearRandomlySelectedUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods/clearRandomlySelectedUser.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearRandomlySelectedUser
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function clearRandomlySelectedUser() {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      randomlySelectedUser: ''
    }
  };

  try {
    const {
      insertedId
    } = Meetings.update(selector, modifier);

    if (insertedId) {
      Logger.info("Cleared randomly selected user from meeting=".concat(meetingId, " by id=").concat(requesterUserId));
    }
  } catch (err) {
    Logger.error("Clearing randomly selected user : ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"endMeeting.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods/endMeeting.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => endMeeting
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function endMeeting() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'LogoutAndEndMeetingCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const payload = {
    userId: requesterUserId
  };
  Logger.warn("Meeting '".concat(meetingId, "' is destroyed by '").concat(requesterUserId, "'"));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toggleLockSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods/toggleLockSettings.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => toggleLockSettings
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function toggleLockSettings(lockSettingsProps) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ChangeLockSettingsInMeetingCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(lockSettingsProps, {
    disableCam: Boolean,
    disableMic: Boolean,
    disablePrivateChat: Boolean,
    disablePublicChat: Boolean,
    disableNote: Boolean,
    hideUserList: Boolean,
    lockedLayout: Boolean,
    lockOnJoin: Boolean,
    lockOnJoinConfigurable: Boolean,
    setBy: Match.Maybe(String)
  });
  const {
    disableCam,
    disableMic,
    disablePrivateChat: disablePrivChat,
    disablePublicChat: disablePubChat,
    disableNote,
    hideUserList,
    lockedLayout,
    lockOnJoin,
    lockOnJoinConfigurable
  } = lockSettingsProps;
  const payload = {
    disableCam,
    disableMic,
    disablePrivChat,
    disablePubChat,
    disableNote,
    hideUserList,
    lockedLayout,
    lockOnJoin,
    lockOnJoinConfigurable,
    setBy: requesterUserId
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toggleRecording.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods/toggleRecording.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => toggleRecording
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let RecordMeetings;
module.link("/imports/api/meetings", {
  RecordMeetings(v) {
    RecordMeetings = v;
  }

}, 3);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 4);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 5);

function toggleRecording() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const EVENT_NAME = 'SetRecordingStatusCmdMsg';
  let meetingRecorded;
  let allowedToRecord;
  const recordObject = RecordMeetings.findOne({
    meetingId
  });

  if (recordObject != null) {
    const {
      allowStartStopRecording,
      recording,
      record
    } = recordObject;
    meetingRecorded = recording;
    allowedToRecord = record && allowStartStopRecording; // TODO-- remove some day
  }

  const payload = {
    recording: !meetingRecorded,
    setBy: requesterUserId
  };
  const selector = {
    meetingId,
    userId: requesterUserId
  };
  const user = Users.findOne(selector);

  if (allowedToRecord && !!user && user.role === ROLE_MODERATOR) {
    Logger.info("Setting the record parameter to ".concat(!meetingRecorded, " for ").concat(meetingId, " by ").concat(requesterUserId));
    return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
  }

  return null;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toggleWebcamsOnlyForModerator.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods/toggleWebcamsOnlyForModerator.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => toggleWebcamsOnlyForModerator
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("../../../common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function toggleWebcamsOnlyForModerator(webcamsOnlyForModerator) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UpdateWebcamsOnlyForModeratorCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(webcamsOnlyForModerator, Boolean);
  const payload = {
    webcamsOnlyForModerator,
    setBy: requesterUserId
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"transferUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods/transferUser.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => transferUser
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function transferUser(fromMeetingId, toMeetingId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'TransferUserToMeetingRequestMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const payload = {
    fromMeetingId,
    toMeetingId,
    userId: requesterUserId
  };
  Logger.verbose('User was transferred from one meting to another', {
    requesterUserId,
    fromMeetingId,
    toMeetingId
  });
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addMeeting.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/addMeeting.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);

let _objectWithoutProperties;

module.link("@babel/runtime/helpers/objectWithoutProperties", {
  default(v) {
    _objectWithoutProperties = v;
  }

}, 1);
module.export({
  default: () => addMeeting
});
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 0);
let check, Match;
module.link("meteor/check", {
  check(v) {
    check = v;
  },

  Match(v) {
    Match = v;
  }

}, 1);
let SanitizeHTML;
module.link("sanitize-html", {
  default(v) {
    SanitizeHTML = v;
  }

}, 2);
let Meetings, RecordMeetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  },

  RecordMeetings(v) {
    RecordMeetings = v;
  }

}, 3);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 4);
let createNote;
module.link("/imports/api/note/server/methods/createNote", {
  default(v) {
    createNote = v;
  }

}, 5);
let createCaptions;
module.link("/imports/api/captions/server/methods/createCaptions", {
  default(v) {
    createCaptions = v;
  }

}, 6);
let addAnnotationsStreamer;
module.link("/imports/api/annotations/server/streamer", {
  addAnnotationsStreamer(v) {
    addAnnotationsStreamer = v;
  }

}, 7);
let addCursorStreamer;
module.link("/imports/api/cursor/server/streamer", {
  addCursorStreamer(v) {
    addCursorStreamer = v;
  }

}, 8);
let addExternalVideoStreamer;
module.link("/imports/api/external-videos/server/streamer", {
  addExternalVideoStreamer(v) {
    addExternalVideoStreamer = v;
  }

}, 9);
let BannedUsers;
module.link("/imports/api/users/server/store/bannedUsers", {
  default(v) {
    BannedUsers = v;
  }

}, 10);

function addMeeting(meeting) {
  const meetingId = meeting.meetingProp.intId;
  check(meetingId, String);
  check(meeting, {
    breakoutProps: {
      sequence: Number,
      freeJoin: Boolean,
      breakoutRooms: Array,
      parentId: String,
      enabled: Boolean,
      record: Boolean,
      privateChatEnabled: Boolean
    },
    meetingProp: {
      intId: String,
      extId: String,
      isBreakout: Boolean,
      name: String
    },
    usersProp: {
      webcamsOnlyForModerator: Boolean,
      guestPolicy: String,
      authenticatedGuest: Boolean,
      maxUsers: Number,
      allowModsToUnmuteUsers: Boolean
    },
    durationProps: {
      createdTime: Number,
      duration: Number,
      createdDate: String,
      meetingExpireIfNoUserJoinedInMinutes: Number,
      meetingExpireWhenLastUserLeftInMinutes: Number,
      userInactivityInspectTimerInMinutes: Number,
      userInactivityThresholdInMinutes: Number,
      userActivitySignResponseDelayInMinutes: Number,
      timeRemaining: Number
    },
    welcomeProp: {
      welcomeMsg: String,
      modOnlyMessage: String,
      welcomeMsgTemplate: String
    },
    recordProp: Match.ObjectIncluding({
      allowStartStopRecording: Boolean,
      autoStartRecording: Boolean,
      record: Boolean
    }),
    password: {
      viewerPass: String,
      moderatorPass: String
    },
    voiceProp: {
      voiceConf: String,
      dialNumber: String,
      telVoice: String,
      muteOnStart: Boolean
    },
    screenshareProps: {
      red5ScreenshareIp: String,
      red5ScreenshareApp: String,
      screenshareConf: String
    },
    metadataProp: Object,
    lockSettingsProps: {
      disableCam: Boolean,
      disableMic: Boolean,
      disablePrivateChat: Boolean,
      disablePublicChat: Boolean,
      disableNote: Boolean,
      hideUserList: Boolean,
      lockOnJoin: Boolean,
      lockOnJoinConfigurable: Boolean,
      lockedLayout: Boolean
    },
    systemProps: {
      html5InstanceId: Number
    }
  });

  const {
    recordProp
  } = meeting,
        restProps = _objectWithoutProperties(meeting, ["recordProp"]);

  const newMeeting = restProps;
  const selector = {
    meetingId
  };
  newMeeting.lockSettingsProps = Object.assign(meeting.lockSettingsProps, {
    setBy: 'temp'
  });
  const meetingEnded = false;
  let {
    welcomeMsg
  } = newMeeting.welcomeProp;

  const sanitizeTextInChat = original => SanitizeHTML(original, {
    allowedTags: ['a', 'b', 'br', 'i', 'img', 'li', 'small', 'span', 'strong', 'u', 'ul'],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src', 'width', 'height']
    },
    allowedSchemes: ['https']
  });

  const sanitizedWelcomeText = sanitizeTextInChat(welcomeMsg);
  welcomeMsg = sanitizedWelcomeText.replace('href="event:', 'href="');

  const insertBlankTarget = (s, i) => "".concat(s.substr(0, i), " target=\"_blank\"").concat(s.substr(i));

  const linkWithoutTarget = new RegExp('<a href="(.*?)">', 'g');
  linkWithoutTarget.test(welcomeMsg);

  if (linkWithoutTarget.lastIndex > 0) {
    welcomeMsg = insertBlankTarget(welcomeMsg, linkWithoutTarget.lastIndex - 1);
  }

  newMeeting.welcomeProp.welcomeMsg = welcomeMsg; // note: as of July 2020 `modOnlyMessage` is not published to the client side.
  // We are sanitizing this data simply to prevent future potential usage
  // At the moment `modOnlyMessage` is obtained from client side as a response to Enter API

  newMeeting.welcomeProp.modOnlyMessage = sanitizeTextInChat(newMeeting.welcomeProp.modOnlyMessage);
  const modifier = {
    $set: Object.assign({
      meetingId,
      meetingEnded,
      publishedPoll: false,
      guestLobbyMessage: '',
      randomlySelectedUser: ''
    }, flat(newMeeting, {
      safe: true
    }))
  };

  if (!process.env.BBB_HTML5_ROLE || process.env.BBB_HTML5_ROLE === 'frontend') {
    addAnnotationsStreamer(meetingId);
    addCursorStreamer(meetingId);
    addExternalVideoStreamer(meetingId); // we don't want to fully process the create meeting message in frontend since it can lead to duplication of meetings in mongo.

    if (process.env.BBB_HTML5_ROLE === 'frontend') {
      return;
    }
  }

  try {
    const {
      insertedId,
      numberAffected
    } = RecordMeetings.upsert(selector, _objectSpread({
      meetingId
    }, recordProp));

    if (insertedId) {
      Logger.info("Added record prop id=".concat(meetingId));
    } else if (numberAffected) {
      Logger.info("Upserted record prop id=".concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding record prop to collection: ".concat(err));
  }

  try {
    const {
      insertedId,
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added meeting id=".concat(meetingId)); // TODO: Here we call Etherpad API to create this meeting notes. Is there a
      // better place we can run this post-creation routine?

      createNote(meetingId);
      createCaptions(meetingId);
      BannedUsers.init(meetingId);
    } else if (numberAffected) {
      Logger.info("Upserted meeting id=".concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding meeting to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeLockSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/changeLockSettings.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeLockSettings
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function changeLockSettings(meetingId, payload) {
  check(meetingId, String);
  check(payload, {
    disableCam: Boolean,
    disableMic: Boolean,
    disablePrivChat: Boolean,
    disablePubChat: Boolean,
    disableNote: Boolean,
    hideUserList: Boolean,
    lockedLayout: Boolean,
    lockOnJoin: Boolean,
    lockOnJoinConfigurable: Boolean,
    setBy: Match.Maybe(String)
  });
  const {
    disableCam,
    disableMic,
    disablePrivChat,
    disablePubChat,
    disableNote,
    hideUserList,
    lockedLayout,
    lockOnJoin,
    lockOnJoinConfigurable,
    setBy
  } = payload;
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      lockSettingsProps: {
        disableCam,
        disableMic,
        disablePrivateChat: disablePrivChat,
        disablePublicChat: disablePubChat,
        disableNote,
        hideUserList,
        lockedLayout,
        lockOnJoin,
        lockOnJoinConfigurable,
        setBy
      }
    }
  };

  try {
    const {
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Changed meeting={".concat(meetingId, "} updated lock settings"));
    } else {
      Logger.info("meeting={".concat(meetingId, "} lock settings were not updated"));
    }
  } catch (err) {
    Logger.error("Changing meeting={".concat(meetingId, "} lock settings: ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeUserLock.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/changeUserLock.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeUserLock
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function changeUserLock(meetingId, payload) {
  check(meetingId, String);
  check(payload, {
    userId: String,
    locked: Boolean,
    lockedBy: String
  });
  const {
    userId,
    locked,
    lockedBy
  } = payload;
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      locked
    }
  };

  try {
    const {
      numberAffected
    } = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("User's userId=".concat(userId, " lock status was changed to: ").concat(locked, " by user userId=").concat(lockedBy));
    } else {
      Logger.info("User's userId=".concat(userId, " lock status wasn't updated"));
    }
  } catch (err) {
    Logger.error("Changing user lock setting: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearMeetingTimeRemaining.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/clearMeetingTimeRemaining.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearMeetingTimeRemaining
});
let MeetingTimeRemaining;
module.link("/imports/api/meetings", {
  MeetingTimeRemaining(v) {
    MeetingTimeRemaining = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearMeetingTimeRemaining(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = MeetingTimeRemaining.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared MeetingTimeRemaining in (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.info("Error on clearing MeetingTimeRemaining in (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = MeetingTimeRemaining.remove({});

      if (numberAffected) {
        Logger.info('Cleared MeetingTimeRemaining in all meetings');
      }
    } catch (err) {
      Logger.error("Error on clearing MeetingTimeRemaining in all meetings. ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearRecordMeeting.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/clearRecordMeeting.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => meetingHasEnded
});
let RecordMeetings;
module.link("/imports/api/meetings", {
  RecordMeetings(v) {
    RecordMeetings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function meetingHasEnded(meetingId) {
  try {
    const numberAffected = RecordMeetings.remove({
      meetingId
    });

    if (numberAffected) {
      Logger.info("Cleared record prop from meeting with id ".concat(meetingId));
    }
  } catch (err) {
    Logger.error("Error on clearing record prop from meeting with id ".concat(meetingId, ". ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"meetingHasEnded.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/meetingHasEnded.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => meetingHasEnded
});
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let BannedUsers;
module.link("/imports/api/users/server/store/bannedUsers", {
  default(v) {
    BannedUsers = v;
  }

}, 2);
let removeAnnotationsStreamer;
module.link("/imports/api/annotations/server/streamer", {
  removeAnnotationsStreamer(v) {
    removeAnnotationsStreamer = v;
  }

}, 3);
let removeCursorStreamer;
module.link("/imports/api/cursor/server/streamer", {
  removeCursorStreamer(v) {
    removeCursorStreamer = v;
  }

}, 4);
let removeExternalVideoStreamer;
module.link("/imports/api/external-videos/server/streamer", {
  removeExternalVideoStreamer(v) {
    removeExternalVideoStreamer = v;
  }

}, 5);
let clearUsers;
module.link("/imports/api/users/server/modifiers/clearUsers", {
  default(v) {
    clearUsers = v;
  }

}, 6);
let clearUsersSettings;
module.link("/imports/api/users-settings/server/modifiers/clearUsersSettings", {
  default(v) {
    clearUsersSettings = v;
  }

}, 7);
let clearGroupChat;
module.link("/imports/api/group-chat/server/modifiers/clearGroupChat", {
  default(v) {
    clearGroupChat = v;
  }

}, 8);
let clearGuestUsers;
module.link("/imports/api/guest-users/server/modifiers/clearGuestUsers", {
  default(v) {
    clearGuestUsers = v;
  }

}, 9);
let clearBreakouts;
module.link("/imports/api/breakouts/server/modifiers/clearBreakouts", {
  default(v) {
    clearBreakouts = v;
  }

}, 10);
let clearAnnotations;
module.link("/imports/api/annotations/server/modifiers/clearAnnotations", {
  default(v) {
    clearAnnotations = v;
  }

}, 11);
let clearSlides;
module.link("/imports/api/slides/server/modifiers/clearSlides", {
  default(v) {
    clearSlides = v;
  }

}, 12);
let clearPolls;
module.link("/imports/api/polls/server/modifiers/clearPolls", {
  default(v) {
    clearPolls = v;
  }

}, 13);
let clearCaptions;
module.link("/imports/api/captions/server/modifiers/clearCaptions", {
  default(v) {
    clearCaptions = v;
  }

}, 14);
let clearPresentationPods;
module.link("/imports/api/presentation-pods/server/modifiers/clearPresentationPods", {
  default(v) {
    clearPresentationPods = v;
  }

}, 15);
let clearVoiceUsers;
module.link("/imports/api/voice-users/server/modifiers/clearVoiceUsers", {
  default(v) {
    clearVoiceUsers = v;
  }

}, 16);
let clearUserInfo;
module.link("/imports/api/users-infos/server/modifiers/clearUserInfo", {
  default(v) {
    clearUserInfo = v;
  }

}, 17);
let clearConnectionStatus;
module.link("/imports/api/connection-status/server/modifiers/clearConnectionStatus", {
  default(v) {
    clearConnectionStatus = v;
  }

}, 18);
let clearScreenshare;
module.link("/imports/api/screenshare/server/modifiers/clearScreenshare", {
  default(v) {
    clearScreenshare = v;
  }

}, 19);
let clearNote;
module.link("/imports/api/note/server/modifiers/clearNote", {
  default(v) {
    clearNote = v;
  }

}, 20);
let clearNetworkInformation;
module.link("/imports/api/network-information/server/modifiers/clearNetworkInformation", {
  default(v) {
    clearNetworkInformation = v;
  }

}, 21);
let clearMeetingTimeRemaining;
module.link("/imports/api/meetings/server/modifiers/clearMeetingTimeRemaining", {
  default(v) {
    clearMeetingTimeRemaining = v;
  }

}, 22);
let clearLocalSettings;
module.link("/imports/api/local-settings/server/modifiers/clearLocalSettings", {
  default(v) {
    clearLocalSettings = v;
  }

}, 23);
let clearRecordMeeting;
module.link("./clearRecordMeeting", {
  default(v) {
    clearRecordMeeting = v;
  }

}, 24);
let clearVoiceCallStates;
module.link("/imports/api/voice-call-states/server/modifiers/clearVoiceCallStates", {
  default(v) {
    clearVoiceCallStates = v;
  }

}, 25);
let clearVideoStreams;
module.link("/imports/api/video-streams/server/modifiers/clearVideoStreams", {
  default(v) {
    clearVideoStreams = v;
  }

}, 26);
let clearAuthTokenValidation;
module.link("/imports/api/auth-token-validation/server/modifiers/clearAuthTokenValidation", {
  default(v) {
    clearAuthTokenValidation = v;
  }

}, 27);
let clearWhiteboardMultiUser;
module.link("/imports/api/whiteboard-multi-user/server/modifiers/clearWhiteboardMultiUser", {
  default(v) {
    clearWhiteboardMultiUser = v;
  }

}, 28);
let Metrics;
module.link("/imports/startup/server/metrics", {
  default(v) {
    Metrics = v;
  }

}, 29);

function meetingHasEnded(meetingId) {
  if (!process.env.BBB_HTML5_ROLE || process.env.BBB_HTML5_ROLE === 'frontend') {
    removeAnnotationsStreamer(meetingId);
    removeCursorStreamer(meetingId);
    removeExternalVideoStreamer(meetingId);
  }

  return Meetings.remove({
    meetingId
  }, () => {
    clearCaptions(meetingId);
    clearGroupChat(meetingId);
    clearGuestUsers(meetingId);
    clearPresentationPods(meetingId);
    clearBreakouts(meetingId);
    clearPolls(meetingId);
    clearAnnotations(meetingId);
    clearSlides(meetingId);
    clearUsers(meetingId);
    clearUsersSettings(meetingId);
    clearVoiceUsers(meetingId);
    clearUserInfo(meetingId);
    clearConnectionStatus(meetingId);
    clearNote(meetingId);
    clearNetworkInformation(meetingId);
    clearLocalSettings(meetingId);
    clearMeetingTimeRemaining(meetingId);
    clearRecordMeeting(meetingId);
    clearVoiceCallStates(meetingId);
    clearVideoStreams(meetingId);
    clearAuthTokenValidation(meetingId);
    clearWhiteboardMultiUser(meetingId);
    clearScreenshare(meetingId);
    BannedUsers.delete(meetingId);
    Metrics.removeMeeting(meetingId);
    Logger.info("Cleared Meetings with id ".concat(meetingId));
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setGuestLobbyMessage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/setGuestLobbyMessage.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setGuestLobbyMessage
});
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function setGuestLobbyMessage(meetingId, guestLobbyMessage) {
  check(meetingId, String);
  check(guestLobbyMessage, String);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      guestLobbyMessage
    }
  };

  try {
    const {
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.verbose("Set guest lobby message meetingId=".concat(meetingId, " guestLobbyMessage=").concat(guestLobbyMessage));
    }
  } catch (err) {
    Logger.error("Setting guest lobby message: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setGuestPolicy.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/setGuestPolicy.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setGuestPolicy
});
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function setGuestPolicy(meetingId, guestPolicy) {
  check(meetingId, String);
  check(guestPolicy, String);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      'usersProp.guestPolicy': guestPolicy
    }
  };

  try {
    const {
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.verbose("Set guest policy meetingId=".concat(meetingId, " guestPolicy=").concat(guestPolicy));
    }
  } catch (err) {
    Logger.error("Setting guest policy: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setPublishedPoll.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/setPublishedPoll.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setPublishedPoll
});
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function setPublishedPoll(meetingId, isPublished) {
  check(meetingId, String);
  check(isPublished, Boolean);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      publishedPoll: isPublished
    }
  };

  try {
    const {
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Set publishedPoll=".concat(isPublished, " in meeitingId=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Setting publishedPoll=".concat(isPublished, " for meetingId=").concat(meetingId));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateRandomViewer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/updateRandomViewer.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateRandomUser
});
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function updateRandomUser(meetingId, userId, requesterId) {
  check(meetingId, String);
  check(userId, String);
  check(requesterId, String);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      randomlySelectedUser: userId
    }
  };

  try {
    const {
      insertedId
    } = Meetings.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Set randomly selected userId=".concat(userId, " by requesterId=").concat(requesterId, " in meeitingId=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Setting randomly selected userId=".concat(userId, " by requesterId=").concat(requesterId, " in meetingId=").concat(meetingId));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webcamOnlyModerator.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/modifiers/webcamOnlyModerator.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeWebcamOnlyModerator
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function changeWebcamOnlyModerator(meetingId, payload) {
  check(meetingId, String);
  check(payload, {
    webcamsOnlyForModerator: Boolean,
    setBy: String
  });
  const {
    webcamsOnlyForModerator
  } = payload;
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      'usersProp.webcamsOnlyForModerator': webcamsOnlyForModerator
    }
  };

  try {
    const {
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Changed meeting={".concat(meetingId, "} updated webcam Only for Moderator"));
    } else {
      Logger.info("meeting={".concat(meetingId, "} webcam Only for Moderator were not updated"));
    }
  } catch (err) {
    Logger.error("Changwing meeting={".concat(meetingId, "} webcam Only for Moderator: ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/eventHandlers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleMeetingCreation;
module.link("./handlers/meetingCreation", {
  default(v) {
    handleMeetingCreation = v;
  }

}, 1);
let handleGetAllMeetings;
module.link("./handlers/getAllMeetings", {
  default(v) {
    handleGetAllMeetings = v;
  }

}, 2);
let handleMeetingEnd;
module.link("./handlers/meetingEnd", {
  default(v) {
    handleMeetingEnd = v;
  }

}, 3);
let handleMeetingDestruction;
module.link("./handlers/meetingDestruction", {
  default(v) {
    handleMeetingDestruction = v;
  }

}, 4);
let handleMeetingLocksChange;
module.link("./handlers/meetingLockChange", {
  default(v) {
    handleMeetingLocksChange = v;
  }

}, 5);
let handleGuestPolicyChanged;
module.link("./handlers/guestPolicyChanged", {
  default(v) {
    handleGuestPolicyChanged = v;
  }

}, 6);
let handleGuestLobbyMessageChanged;
module.link("./handlers/guestLobbyMessageChanged", {
  default(v) {
    handleGuestLobbyMessageChanged = v;
  }

}, 7);
let handleUserLockChange;
module.link("./handlers/userLockChange", {
  default(v) {
    handleUserLockChange = v;
  }

}, 8);
let handleRecordingStatusChange;
module.link("./handlers/recordingStatusChange", {
  default(v) {
    handleRecordingStatusChange = v;
  }

}, 9);
let handleRecordingTimerChange;
module.link("./handlers/recordingTimerChange", {
  default(v) {
    handleRecordingTimerChange = v;
  }

}, 10);
let handleTimeRemainingUpdate;
module.link("./handlers/timeRemainingUpdate", {
  default(v) {
    handleTimeRemainingUpdate = v;
  }

}, 11);
let handleChangeWebcamOnlyModerator;
module.link("./handlers/webcamOnlyModerator", {
  default(v) {
    handleChangeWebcamOnlyModerator = v;
  }

}, 12);
let handleSelectRandomViewer;
module.link("./handlers/selectRandomViewer", {
  default(v) {
    handleSelectRandomViewer = v;
  }

}, 13);
RedisPubSub.on('MeetingCreatedEvtMsg', handleMeetingCreation);
RedisPubSub.on('SyncGetMeetingInfoRespMsg', handleGetAllMeetings);
RedisPubSub.on('MeetingEndingEvtMsg', handleMeetingEnd);
RedisPubSub.on('MeetingDestroyedEvtMsg', handleMeetingDestruction);
RedisPubSub.on('LockSettingsInMeetingChangedEvtMsg', handleMeetingLocksChange);
RedisPubSub.on('UserLockedInMeetingEvtMsg', handleUserLockChange);
RedisPubSub.on('RecordingStatusChangedEvtMsg', handleRecordingStatusChange);
RedisPubSub.on('UpdateRecordingTimerEvtMsg', handleRecordingTimerChange);
RedisPubSub.on('WebcamsOnlyForModeratorChangedEvtMsg', handleChangeWebcamOnlyModerator);
RedisPubSub.on('GetLockSettingsRespMsg', handleMeetingLocksChange);
RedisPubSub.on('GuestPolicyChangedEvtMsg', handleGuestPolicyChanged);
RedisPubSub.on('GuestLobbyMessageChangedEvtMsg', handleGuestLobbyMessageChanged);
RedisPubSub.on('MeetingTimeRemainingUpdateEvtMsg', handleTimeRemainingUpdate);
RedisPubSub.on('SelectRandomViewerRespMsg', handleSelectRandomViewer);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/index.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/methods.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let endMeeting;
module.link("./methods/endMeeting", {
  default(v) {
    endMeeting = v;
  }

}, 1);
let toggleRecording;
module.link("./methods/toggleRecording", {
  default(v) {
    toggleRecording = v;
  }

}, 2);
let transferUser;
module.link("./methods/transferUser", {
  default(v) {
    transferUser = v;
  }

}, 3);
let toggleLockSettings;
module.link("./methods/toggleLockSettings", {
  default(v) {
    toggleLockSettings = v;
  }

}, 4);
let toggleWebcamsOnlyForModerator;
module.link("./methods/toggleWebcamsOnlyForModerator", {
  default(v) {
    toggleWebcamsOnlyForModerator = v;
  }

}, 5);
let clearRandomlySelectedUser;
module.link("./methods/clearRandomlySelectedUser", {
  default(v) {
    clearRandomlySelectedUser = v;
  }

}, 6);
Meteor.methods({
  endMeeting,
  toggleRecording,
  toggleLockSettings,
  transferUser,
  toggleWebcamsOnlyForModerator,
  clearRandomlySelectedUser
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/server/publishers.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Meetings, RecordMeetings, MeetingTimeRemaining;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  },

  RecordMeetings(v) {
    RecordMeetings = v;
  },

  MeetingTimeRemaining(v) {
    MeetingTimeRemaining = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 4);
const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

function meetings(role) {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Meetings was requested by unauth connection ".concat(this.connection.id));
    return Meetings.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing meeting', {
    meetingId,
    userId
  });
  const selector = {
    $or: [{
      meetingId
    }]
  };
  const User = Users.findOne({
    userId,
    meetingId
  }, {
    fields: {
      role: 1
    }
  });

  if (!!User && User.role === ROLE_MODERATOR) {
    selector.$or.push({
      'meetingProp.isBreakout': true,
      'breakoutProps.parentId': meetingId
    });
  }

  const options = {
    fields: {
      password: false,
      'welcomeProp.modOnlyMessage': false
    }
  };
  return Meetings.find(selector, options);
}

function publish() {
  const boundMeetings = meetings.bind(this);
  return boundMeetings(...arguments);
}

Meteor.publish('meetings', publish);

function recordMeetings() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing RecordMeetings was requested by unauth connection ".concat(this.connection.id));
    return RecordMeetings.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug("Publishing RecordMeetings for ".concat(meetingId, " ").concat(userId));
  return RecordMeetings.find({
    meetingId
  });
}

function recordPublish() {
  const boundRecordMeetings = recordMeetings.bind(this);
  return boundRecordMeetings(...arguments);
}

Meteor.publish('record-meetings', recordPublish);

function meetingTimeRemaining() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing MeetingTimeRemaining was requested by unauth connection ".concat(this.connection.id));
    return MeetingTimeRemaining.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug("Publishing MeetingTimeRemaining for ".concat(meetingId, " ").concat(userId));
  return MeetingTimeRemaining.find({
    meetingId
  });
}

function timeRemainingPublish() {
  const boundtimeRemaining = meetingTimeRemaining.bind(this);
  return boundtimeRemaining(...arguments);
}

Meteor.publish('meeting-time-remaining', timeRemainingPublish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/meetings/index.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  RecordMeetings: () => RecordMeetings,
  MeetingTimeRemaining: () => MeetingTimeRemaining
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Meetings = new Mongo.Collection('meetings');
const RecordMeetings = new Mongo.Collection('record-meetings');
const MeetingTimeRemaining = new Mongo.Collection('meeting-time-remaining');

if (Meteor.isServer) {
  // types of queries for the meetings:
  // 1. meetingId
  Meetings._ensureIndex({
    meetingId: 1
  });

  RecordMeetings._ensureIndex({
    meetingId: 1
  });

  MeetingTimeRemaining._ensureIndex({
    meetingId: 1
  });
}

module.exportDefault(Meetings);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"network-information":{"server":{"methods":{"userInstabilityDetected.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/network-information/server/methods/userInstabilityDetected.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userInstabilityDetected
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let NetworkInformation;
module.link("/imports/api/network-information", {
  default(v) {
    NetworkInformation = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function userInstabilityDetected(sender) {
  const {
    meetingId,
    requesterUserId: receiver
  } = extractCredentials(this.userId);
  check(sender, String);
  const payload = {
    time: new Date().getTime(),
    meetingId,
    receiver,
    sender
  };
  Logger.debug('Receiver reported a network instability', {
    receiver,
    meetingId
  });
  return NetworkInformation.insert(payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearNetworkInformation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/network-information/server/modifiers/clearNetworkInformation.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearNetworkInformation
});
let NetworkInformation;
module.link("/imports/api/network-information", {
  default(v) {
    NetworkInformation = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearNetworkInformation(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = NetworkInformation.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Network Information (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing Network Information (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = NetworkInformation.remove({});

      if (numberAffected) {
        Logger.info('Cleared Network Information (all)');
      }
    } catch (err) {
      Logger.error("Error on clearing Network Information (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/network-information/server/index.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./methods");
module.link("./publisher");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/network-information/server/methods.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let userInstabilityDetected;
module.link("./methods/userInstabilityDetected", {
  default(v) {
    userInstabilityDetected = v;
  }

}, 1);
Meteor.methods({
  userInstabilityDetected
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publisher.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/network-information/server/publisher.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let NetworkInformation;
module.link("/imports/api/network-information", {
  default(v) {
    NetworkInformation = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function networkInformation() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing NetworkInformation was requested by unauth connection ".concat(this.connection.id));
    return NetworkInformation.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug("Publishing NetworkInformation for ".concat(meetingId, " ").concat(userId));
  return NetworkInformation.find({
    meetingId
  });
}

function publish() {
  const boundNetworkInformation = networkInformation.bind(this);
  return boundNetworkInformation(...arguments);
}

Meteor.publish('network-information', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/network-information/index.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const NetworkInformation = new Mongo.Collection('network-information');

if (Meteor.isServer) {
  NetworkInformation._ensureIndex({
    meetingId: 1
  });
}

module.exportDefault(NetworkInformation);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"note":{"server":{"handlers":{"padUpdate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/handlers/padUpdate.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePadUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let updateNote;
module.link("/imports/api/note/server/modifiers/updateNote", {
  default(v) {
    updateNote = v;
  }

}, 1);

function handlePadUpdate(_ref) {
  let {
    body
  } = _ref;
  const {
    pad,
    revs
  } = body;
  const {
    id
  } = pad;
  check(id, String);
  check(revs, Number);
  updateNote(id, revs);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addPad.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/methods/addPad.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addPad
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 3);

function addPad(meetingId, padId, readOnlyId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'AddPadSysMsg';
  check(meetingId, String);
  check(padId, String);
  check(readOnlyId, String);
  const payload = {
    padId,
    readOnlyId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, 'nodeJSapp', payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createNote.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/methods/createNote.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => createNote
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let generateNoteId, createPadURL, getReadOnlyIdURL, isEnabled, getDataFromResponse;
module.link("/imports/api/note/server/helpers", {
  generateNoteId(v) {
    generateNoteId = v;
  },

  createPadURL(v) {
    createPadURL = v;
  },

  getReadOnlyIdURL(v) {
    getReadOnlyIdURL = v;
  },

  isEnabled(v) {
    isEnabled = v;
  },

  getDataFromResponse(v) {
    getDataFromResponse = v;
  }

}, 2);
let addNote;
module.link("/imports/api/note/server/modifiers/addNote", {
  default(v) {
    addNote = v;
  }

}, 3);
let axios;
module.link("axios", {
  default(v) {
    axios = v;
  }

}, 4);

function createNote(meetingId) {
  // Avoid note creation if this feature is disabled
  if (!isEnabled()) {
    Logger.warn("Notes are disabled for ".concat(meetingId));
    return;
  }

  check(meetingId, String);
  const noteId = generateNoteId(meetingId);
  const createURL = createPadURL(noteId);
  axios({
    method: 'get',
    url: createURL,
    responseType: 'json'
  }).then(responseOuter => {
    const {
      status
    } = responseOuter;

    if (status !== 200) {
      Logger.error("Could not get note info for ".concat(meetingId, " ").concat(status));
      return;
    }

    const readOnlyURL = getReadOnlyIdURL(noteId);
    axios({
      method: 'get',
      url: readOnlyURL,
      responseType: 'json'
    }).then(response => {
      const readOnlyNoteId = getDataFromResponse(response.data, 'readOnlyID');

      if (readOnlyNoteId) {
        addNote(meetingId, noteId, readOnlyNoteId);
      } else {
        Logger.error("Could not get note readOnlyID for ".concat(meetingId));
      }
    }).catch(error => Logger.error("Could not get note readOnlyID for ".concat(meetingId, ": ").concat(error)));
  }).catch(error => Logger.error("Could not create note for ".concat(meetingId, ": ").concat(error)));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addNote.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/modifiers/addNote.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addNote
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Note;
module.link("/imports/api/note", {
  default(v) {
    Note = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let addPad;
module.link("/imports/api/note/server/methods/addPad", {
  default(v) {
    addPad = v;
  }

}, 3);

function addNote(meetingId, noteId, readOnlyNoteId) {
  check(meetingId, String);
  check(noteId, String);
  check(readOnlyNoteId, String);
  const selector = {
    meetingId,
    noteId
  };
  const modifier = {
    meetingId,
    noteId,
    readOnlyNoteId,
    revs: 0
  };

  try {
    const {
      insertedId
    } = Note.upsert(selector, modifier);

    if (insertedId) {
      addPad(meetingId, noteId, readOnlyNoteId);
      Logger.info("Added note id=".concat(noteId, " readOnlyId=").concat(readOnlyNoteId, " meeting=").concat(meetingId));
    } else {
      Logger.info("Upserted note id=".concat(noteId, " readOnlyId=").concat(readOnlyNoteId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding note to the collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearNote.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/modifiers/clearNote.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearNote
});
let Note;
module.link("/imports/api/note", {
  default(v) {
    Note = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearNote(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = Note.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Note (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing Note (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = Note.remove({});

      if (numberAffected) {
        Logger.info('Cleared Note (all)');
      }
    } catch (err) {
      Logger.error("Error on clearing Note (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateNote.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/modifiers/updateNote.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateNote
});
let Note;
module.link("/imports/api/note", {
  default(v) {
    Note = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);

function updateNote(noteId, revs) {
  check(noteId, String);
  check(revs, Number);
  const selector = {
    noteId
  };
  const modifier = {
    $set: {
      revs
    }
  };

  try {
    const numberAffected = Note.update(selector, modifier, {
      multi: true
    });

    if (numberAffected) {
      Logger.verbose('Notes: update note pad', {
        pad: noteId,
        revs
      });
    }
  } catch (err) {
    Logger.error('Notes: error when updating note pad', {
      err
    });
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/eventHandlers.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForNotePadOnly;
module.link("/imports/api/note/server/helpers", {
  processForNotePadOnly(v) {
    processForNotePadOnly = v;
  }

}, 1);
let handlePadUpdate;
module.link("./handlers/padUpdate", {
  default(v) {
    handlePadUpdate = v;
  }

}, 2);
RedisPubSub.on('PadUpdateSysMsg', processForNotePadOnly(handlePadUpdate));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/helpers.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  generateNoteId: () => generateNoteId,
  createPadURL: () => createPadURL,
  getReadOnlyIdURL: () => getReadOnlyIdURL,
  isEnabled: () => isEnabled,
  getDataFromResponse: () => getDataFromResponse,
  appendTextURL: () => appendTextURL,
  processForNotePadOnly: () => processForNotePadOnly
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let hashSHA1;
module.link("/imports/api/common/server/helpers", {
  hashSHA1(v) {
    hashSHA1 = v;
  }

}, 1);
const ETHERPAD = Meteor.settings.private.etherpad;
const NOTE_CONFIG = Meteor.settings.public.note;
const BASE_URL = "http://".concat(ETHERPAD.host, ":").concat(ETHERPAD.port, "/api/").concat(ETHERPAD.version);
const TOKEN = '_';

const createPadURL = padId => "".concat(BASE_URL, "/createPad?apikey=").concat(ETHERPAD.apikey, "&padID=").concat(padId);

const getReadOnlyIdURL = padId => "".concat(BASE_URL, "/getReadOnlyID?apikey=").concat(ETHERPAD.apikey, "&padID=").concat(padId);

const appendTextURL = (padId, text) => "".concat(BASE_URL, "/appendText?apikey=").concat(ETHERPAD.apikey, "&padID=").concat(padId, "&text=").concat(encodeURIComponent(text));

const generateNoteId = meetingId => hashSHA1(meetingId + ETHERPAD.apikey);

const isEnabled = () => NOTE_CONFIG.enabled;

const getDataFromResponse = (data, key) => {
  if (data) {
    const innerData = data.data;

    if (innerData && innerData[key]) {
      return innerData[key];
    }
  }

  return null;
};

const isNotePad = padId => padId.search(TOKEN);

const processForNotePadOnly = fn => function (message) {
  const {
    body
  } = message;
  const {
    pad
  } = body;
  const {
    id
  } = pad;
  check(id, String);

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (isNotePad(id)) return fn(message, ...args);
  return () => {};
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/index.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./publishers");
module.link("./eventHandlers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/server/publishers.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Note;
module.link("/imports/api/note", {
  default(v) {
    Note = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function note() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Note was requested by unauth connection ".concat(this.connection.id));
    return Note.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.info("Publishing Note for ".concat(meetingId, " ").concat(userId));
  return Note.find({
    meetingId
  });
}

function publish() {
  const boundNote = note.bind(this);
  return boundNote(...arguments);
}

Meteor.publish('note', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/note/index.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Note = new Mongo.Collection('note');

if (Meteor.isServer) {
  Note._ensureIndex({
    meetingId: 1,
    noteId: 1
  });
}

module.exportDefault(Note);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"polls":{"server":{"handlers":{"pollPublished.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/pollPublished.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => pollPublished
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removePoll;
module.link("../modifiers/removePoll", {
  default(v) {
    removePoll = v;
  }

}, 1);
let setPublishedPoll;
module.link("../../../meetings/server/modifiers/setPublishedPoll", {
  default(v) {
    setPublishedPoll = v;
  }

}, 2);

function pollPublished(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    pollId
  } = body;
  check(meetingId, String);
  check(pollId, String);
  setPublishedPoll(meetingId, true);
  return removePoll(meetingId, pollId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pollStarted.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/pollStarted.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => pollStarted
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addPoll;
module.link("../modifiers/addPoll", {
  default(v) {
    addPoll = v;
  }

}, 1);
let setPublishedPoll;
module.link("../../../meetings/server/modifiers/setPublishedPoll", {
  default(v) {
    setPublishedPoll = v;
  }

}, 2);

function pollStarted(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    userId,
    poll,
    pollType,
    question
  } = body;
  check(meetingId, String);
  check(userId, String);
  check(poll, Object);
  check(pollType, String);
  check(question, String);
  setPublishedPoll(meetingId, false);
  return addPoll(meetingId, userId, poll, pollType, question);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pollStopped.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/pollStopped.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => pollStopped
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removePoll;
module.link("../modifiers/removePoll", {
  default(v) {
    removePoll = v;
  }

}, 1);
let clearPolls;
module.link("../modifiers/clearPolls", {
  default(v) {
    clearPolls = v;
  }

}, 2);

function pollStopped(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    poll
  } = body;
  check(meetingId, String);

  if (poll) {
    const {
      pollId
    } = poll;
    check(pollId, String);
    return removePoll(meetingId, pollId);
  }

  return clearPolls(meetingId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendPollChatMsg.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/sendPollChatMsg.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => sendPollChatMsg
});
let addSystemMsg;
module.link("../../../group-chat-msg/server/modifiers/addSystemMsg", {
  default(v) {
    addSystemMsg = v;
  }

}, 0);

function sendPollChatMsg(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    poll
  } = body;
  const CHAT_CONFIG = Meteor.settings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  const PUBLIC_CHAT_SYSTEM_ID = CHAT_CONFIG.system_userid;
  const CHAT_POLL_RESULTS_MESSAGE = CHAT_CONFIG.system_messages_keys.chat_poll_result;
  const SYSTEM_CHAT_TYPE = CHAT_CONFIG.type_system;
  const {
    answers,
    numRespondents
  } = poll;
  let responded = 0;
  let resultString = 'bbb-published-poll-\n';
  answers.map(item => {
    responded += item.numVotes;
    return item;
  }).map(item => {
    const numResponded = responded === numRespondents ? numRespondents : responded;
    const pct = Math.round(item.numVotes / numResponded * 100);
    const pctFotmatted = "".concat(Number.isNaN(pct) ? 0 : pct, "%");
    resultString += "".concat(item.key, ": ").concat(item.numVotes || 0, " | ").concat(pctFotmatted, "\n");
  });
  const payload = {
    id: "".concat(SYSTEM_CHAT_TYPE, "-").concat(CHAT_POLL_RESULTS_MESSAGE),
    timestamp: Date.now(),
    correlationId: "".concat(PUBLIC_CHAT_SYSTEM_ID, "-").concat(Date.now()),
    sender: {
      id: PUBLIC_CHAT_SYSTEM_ID,
      name: ''
    },
    message: resultString
  };
  return addSystemMsg(meetingId, PUBLIC_GROUP_CHAT_ID, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userResponded.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/userResponded.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userResponded
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function userResponded(_ref) {
  let {
    body
  } = _ref;
  const {
    pollId,
    userId,
    answerId
  } = body;
  check(pollId, String);
  check(userId, String);
  check(answerId, Number);
  const selector = {
    id: pollId
  };
  const modifier = {
    $pull: {
      users: userId
    },
    $push: {
      responses: {
        userId,
        answerId
      }
    }
  };

  try {
    const numberAffected = Polls.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Updating Poll response (userId: ".concat(userId, ", response: ").concat(answerId, ", pollId: ").concat(pollId, ")"));
    }
  } catch (err) {
    Logger.error("Updating Poll responses: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userTypedResponse.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/userTypedResponse.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userTypedResponse
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);

function userTypedResponse(_ref) {
  let {
    header,
    body
  } = _ref;
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'RespondToPollReqMsg';
  const {
    pollId,
    userId,
    answer
  } = body;
  const {
    meetingId
  } = header;
  check(pollId, String);
  check(meetingId, String);
  check(userId, String);
  check(answer, String);
  const poll = Polls.findOne({
    meetingId,
    id: pollId
  });
  let answerId = 0;
  poll.answers.forEach(a => {
    const {
      id,
      key
    } = a;
    if (key === answer) answerId = id;
  });
  const payload = {
    requesterId: userId,
    pollId,
    questionId: 0,
    answerId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userVoted.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/handlers/userVoted.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userVoted
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let updateVotes;
module.link("../modifiers/updateVotes", {
  default(v) {
    updateVotes = v;
  }

}, 1);

function userVoted(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    poll
  } = body;
  check(meetingId, String);
  check(poll, {
    id: String,
    answers: [{
      id: Number,
      key: String,
      numVotes: Number
    }],
    numRespondents: Number,
    numResponders: Number
  });
  return updateVotes(poll, meetingId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"publishPoll.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/methods/publishPoll.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => publishPoll
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function publishPoll() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ShowPollResultReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const poll = Polls.findOne({
    meetingId
  }); // TODO--send pollid from client

  if (!poll) {
    Logger.error("Attempted to publish inexisting poll for meetingId: ".concat(meetingId));
    return false;
  }

  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, {
    requesterId: requesterUserId,
    pollId: poll.id
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishTypedVote.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/methods/publishTypedVote.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => publishTypedVote
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function publishTypedVote(id, pollAnswer) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  let EVENT_NAME = 'RespondToTypedPollReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(pollAnswer, String);
  check(id, String);
  const activePoll = Polls.findOne({
    meetingId,
    id
  }, {
    fields: {
      answers: 1
    }
  });
  let existingAnsId = null;
  activePoll.answers.forEach(a => {
    if (a.key === pollAnswer) existingAnsId = a.id;
  });

  if (existingAnsId !== null) {
    check(existingAnsId, Number);
    EVENT_NAME = 'RespondToPollReqMsg';
    return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, {
      requesterId: requesterUserId,
      pollId: id,
      questionId: 0,
      answerId: existingAnsId
    });
  }

  const payload = {
    requesterId: requesterUserId,
    pollId: id,
    questionId: 0,
    answer: pollAnswer
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishVote.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/methods/publishVote.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => publishVote
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function publishVote(pollId, pollAnswerId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'RespondToPollReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(pollAnswerId, Number);
  check(pollId, String);
  const allowedToVote = Polls.findOne({
    id: pollId,
    users: {
      $in: [requesterUserId]
    }
  }, {
    fields: {
      users: 1
    }
  });

  if (!allowedToVote) {
    Logger.info("Poll User={".concat(requesterUserId, "} has already voted in PollId={").concat(pollId, "}"));
    return null;
  }

  const selector = {
    users: requesterUserId,
    meetingId,
    'answers.id': pollAnswerId
  };
  const payload = {
    requesterId: requesterUserId,
    pollId,
    questionId: 0,
    answerId: pollAnswerId
  };
  /*
   We keep an array of people who were in the meeting at the time the poll
   was started. The poll is published to them only.
   Once they vote - their ID is removed and they cannot see the poll anymore
  */

  const modifier = {
    $pull: {
      users: requesterUserId
    }
  };

  try {
    const numberAffected = Polls.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Removed responded user=".concat(requesterUserId, " from poll (meetingId: ").concat(meetingId, ", pollId: ").concat(pollId, "!)"));
      RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
    }
  } catch (err) {
    Logger.error("Removing responded user from Polls collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startPoll.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/methods/startPoll.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => startPoll
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function startPoll(pollType, pollId, question, answers) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  let EVENT_NAME = 'StartPollReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(pollId, String);
  check(pollType, String);
  const payload = {
    requesterId: requesterUserId,
    pollId: "".concat(pollId, "/").concat(new Date().getTime()),
    pollType,
    question
  };

  if (pollType === 'custom') {
    EVENT_NAME = 'StartCustomPollReqMsg';
    check(answers, Array);
    payload.answers = answers;
  }

  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stopPoll.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/methods/stopPoll.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => stopPoll
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 1);

function stopPoll() {
  const {
    meetingId,
    requesterUserId: requesterId
  } = extractCredentials(this.userId);
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'StopPollReqMsg';
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterId, {
    requesterId
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addPoll.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/modifiers/addPoll.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addPoll
});
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 0);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 3);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 4);

function addPoll(meetingId, requesterId, poll, pollType) {
  let question = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
  check(requesterId, String);
  check(meetingId, String);
  check(poll, {
    id: String,
    answers: [{
      id: Number,
      key: String
    }]
  });
  const userSelector = {
    meetingId,
    userId: {
      $ne: requesterId
    },
    clientType: {
      $ne: 'dial-in-user'
    }
  };
  const userIds = Users.find(userSelector, {
    fields: {
      userId: 1
    }
  }).fetch().map(user => user.userId);
  const selector = {
    meetingId,
    requester: requesterId,
    id: poll.id
  };
  const modifier = Object.assign({
    meetingId
  }, {
    requester: requesterId
  }, {
    users: userIds
  }, {
    question,
    pollType
  }, flat(poll, {
    safe: true
  }));

  try {
    const {
      insertedId
    } = Polls.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added Poll id=".concat(poll.id));
    } else {
      Logger.info("Upserted Poll id=".concat(poll.id));
    }
  } catch (err) {
    Logger.error("Adding Poll to collection: ".concat(poll.id));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearPolls.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/modifiers/clearPolls.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearPolls
});
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearPolls(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = Polls.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Polls (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.info("Error on clearing Polls (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = Polls.remove({});

      if (numberAffected) {
        Logger.info('Cleared Polls (all)');
      }
    } catch (err) {
      Logger.info("Error on clearing Polls (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removePoll.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/modifiers/removePoll.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removePoll
});
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function removePoll(meetingId, id) {
  check(meetingId, String);
  check(id, String);
  const selector = {
    meetingId,
    id
  };

  try {
    const numberAffected = Polls.remove(selector);

    if (numberAffected) {
      Logger.info("Removed Poll id=".concat(id));
    }
  } catch (err) {
    Logger.error("Removing Poll from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateVotes.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/modifiers/updateVotes.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateVotes
});
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 3);

function updateVotes(poll, meetingId) {
  check(meetingId, String);
  check(poll, Object);
  const {
    id,
    answers,
    numResponders,
    numRespondents
  } = poll;
  check(id, String);
  check(answers, Array);
  check(numResponders, Number);
  check(numRespondents, Number);
  const selector = {
    meetingId,
    id
  };
  const modifier = {
    $set: flat(poll, {
      safe: true
    })
  };

  try {
    const numberAffected = Polls.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Updating Polls collection (meetingId: ".concat(meetingId, ", pollId: ").concat(id, "!)"));
    }
  } catch (err) {
    Logger.error("Updating Polls collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/eventHandlers.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handlePollStarted;
module.link("./handlers/pollStarted", {
  default(v) {
    handlePollStarted = v;
  }

}, 1);
let handlePollStopped;
module.link("./handlers/pollStopped", {
  default(v) {
    handlePollStopped = v;
  }

}, 2);
let handlePollPublished;
module.link("./handlers/pollPublished", {
  default(v) {
    handlePollPublished = v;
  }

}, 3);
let handleSendSystemChatForPublishedPoll;
module.link("./handlers/sendPollChatMsg", {
  default(v) {
    handleSendSystemChatForPublishedPoll = v;
  }

}, 4);
let handleUserVoted;
module.link("./handlers/userVoted", {
  default(v) {
    handleUserVoted = v;
  }

}, 5);
let handleUserResponded;
module.link("./handlers/userResponded", {
  default(v) {
    handleUserResponded = v;
  }

}, 6);
let handleUserTypedResponse;
module.link("./handlers/userTypedResponse", {
  default(v) {
    handleUserTypedResponse = v;
  }

}, 7);
RedisPubSub.on('PollShowResultEvtMsg', handlePollPublished);
RedisPubSub.on('PollShowResultEvtMsg', handleSendSystemChatForPublishedPoll);
RedisPubSub.on('PollStartedEvtMsg', handlePollStarted);
RedisPubSub.on('PollStoppedEvtMsg', handlePollStopped);
RedisPubSub.on('PollUpdatedEvtMsg', handleUserVoted);
RedisPubSub.on('UserRespondedToPollRespMsg', handleUserResponded);
RedisPubSub.on('UserRespondedToTypedPollRespMsg', handleUserTypedResponse);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/index.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/methods.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let publishTypedVote;
module.link("./methods/publishTypedVote", {
  default(v) {
    publishTypedVote = v;
  }

}, 1);
let publishVote;
module.link("./methods/publishVote", {
  default(v) {
    publishVote = v;
  }

}, 2);
let publishPoll;
module.link("./methods/publishPoll", {
  default(v) {
    publishPoll = v;
  }

}, 3);
let startPoll;
module.link("./methods/startPoll", {
  default(v) {
    startPoll = v;
  }

}, 4);
let stopPoll;
module.link("./methods/stopPoll", {
  default(v) {
    stopPoll = v;
  }

}, 5);
Meteor.methods({
  publishVote,
  publishTypedVote,
  publishPoll,
  startPoll,
  stopPoll
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/server/publishers.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Polls;
module.link("/imports/api/polls", {
  default(v) {
    Polls = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function currentPoll() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Polls was requested by unauth connection ".concat(this.connection.id));
    return Polls.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Polls', {
    meetingId,
    userId
  });
  const selector = {
    meetingId
  };
  return Polls.find(selector);
}

function publishCurrentPoll() {
  const boundPolls = currentPoll.bind(this);
  return boundPolls(...arguments);
}

Meteor.publish('current-poll', publishCurrentPoll);

function polls() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Polls was requested by unauth connection ".concat(this.connection.id));
    return Polls.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing polls', {
    meetingId,
    userId
  });
  const selector = {
    meetingId,
    users: userId
  };
  return Polls.find(selector);
}

function publish() {
  const boundPolls = polls.bind(this);
  return boundPolls(...arguments);
}

Meteor.publish('polls', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/polls/index.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Polls = new Mongo.Collection('polls');

if (Meteor.isServer) {
  // We can have just one active poll per meeting
  // makes no sense to index it by anything other than meetingId
  Polls._ensureIndex({
    meetingId: 1
  });
}

module.exportDefault(Polls);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"presentation-pods":{"server":{"handlers":{"createNewPresentationPod.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/handlers/createNewPresentationPod.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleCreateNewPresentationPod
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addPresentationPod;
module.link("../modifiers/addPresentationPod", {
  default(v) {
    addPresentationPod = v;
  }

}, 1);

function handleCreateNewPresentationPod(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, {
    currentPresenterId: String,
    podId: String
  });
  check(meetingId, String);
  const {
    currentPresenterId,
    podId
  } = body;
  const pod = {
    currentPresenterId,
    podId
  };
  addPresentationPod(meetingId, pod);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removePresentationPod.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/handlers/removePresentationPod.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleRemovePresentationPod
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removePresentationPod;
module.link("../modifiers/removePresentationPod", {
  default(v) {
    removePresentationPod = v;
  }

}, 1);

function handleRemovePresentationPod(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  check(meetingId, String);
  const {
    podId
  } = body;
  check(podId, String);
  removePresentationPod(meetingId, podId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setPresenterInPod.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/handlers/setPresenterInPod.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleSetPresenterInPod
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let setPresenterInPod;
module.link("../modifiers/setPresenterInPod", {
  default(v) {
    setPresenterInPod = v;
  }

}, 1);

function handleSetPresenterInPod(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    podId,
    nextPresenterId
  } = body;
  check(podId, String);
  check(nextPresenterId, String);
  setPresenterInPod(meetingId, podId, nextPresenterId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"syncGetPresentationPods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/handlers/syncGetPresentationPods.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleSyncGetPresentationPods
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 1);
let removePresentationPod;
module.link("../modifiers/removePresentationPod", {
  default(v) {
    removePresentationPod = v;
  }

}, 2);
let addPresentationPod;
module.link("../modifiers/addPresentationPod", {
  default(v) {
    addPresentationPod = v;
  }

}, 3);

function handleSyncGetPresentationPods(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  check(meetingId, String);
  const {
    pods
  } = body;
  check(pods, Array);
  const presentationPodIds = pods.map(pod => pod.id);
  const presentationPodsToRemove = PresentationPods.find({
    meetingId,
    podId: {
      $nin: presentationPodIds
    }
  }, {
    fields: {
      podId: 1
    }
  }).fetch();
  presentationPodsToRemove.forEach(p => removePresentationPod(meetingId, p.podId));
  pods.forEach(pod => {
    // 'podId' and 'currentPresenterId' for some reason called 'id' and 'currentPresenter'
    // in this message
    const {
      id: podId,
      currentPresenter: currentPresenterId,
      presentations
    } = pod;
    addPresentationPod(meetingId, {
      podId,
      currentPresenterId
    }, presentations);
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addPresentationPod.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/modifiers/addPresentationPod.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addPresentationPod
});
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 0);
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let addPresentation;
module.link("/imports/api/presentations/server/modifiers/addPresentation", {
  default(v) {
    addPresentation = v;
  }

}, 3);

function addPresentationPod(meetingId, pod) {
  let presentations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
  check(meetingId, String);
  check(presentations, Match.Maybe(Array));
  check(pod, {
    currentPresenterId: String,
    podId: String
  });
  const {
    currentPresenterId,
    podId
  } = pod;
  const selector = {
    meetingId,
    podId
  };
  const modifier = {
    meetingId,
    podId,
    currentPresenterId
  };

  try {
    const {
      insertedId
    } = PresentationPods.upsert(selector, modifier); // if it's a Sync message - continue adding the attached presentations

    if (presentations) {
      presentations.forEach(presentation => addPresentation(meetingId, podId, presentation));
    }

    if (insertedId) {
      Logger.info("Added presentation pod id=".concat(podId, " meeting=").concat(meetingId));
    } else {
      Logger.info("Upserted presentation pod id=".concat(podId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding presentation pod to the collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearPresentationPods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/modifiers/clearPresentationPods.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearPresentationPods
});
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let clearPresentations;
module.link("/imports/api/presentations/server/modifiers/clearPresentations", {
  default(v) {
    clearPresentations = v;
  }

}, 2);
let clearPresentationUploadToken;
module.link("/imports/api/presentation-upload-token/server/modifiers/clearPresentationUploadToken", {
  default(v) {
    clearPresentationUploadToken = v;
  }

}, 3);

function clearPresentationPods(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = PresentationPods.remove({
        meetingId
      });

      if (numberAffected) {
        clearPresentations(meetingId);
        clearPresentationUploadToken(meetingId);
        Logger.info("Cleared Presentations Pods (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing Presentations Pods (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = PresentationPods.remove({});

      if (numberAffected) {
        clearPresentations();
        clearPresentationUploadToken();
        Logger.info('Cleared Presentations Pods (all)');
      }
    } catch (err) {
      Logger.error("Error on clearing Presentations Pods (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removePresentationPod.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/modifiers/removePresentationPod.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removePresentationPod
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let clearPresentations;
module.link("/imports/api/presentations/server/modifiers/clearPresentations", {
  default(v) {
    clearPresentations = v;
  }

}, 3);
let clearPresentationUploadToken;
module.link("/imports/api/presentation-upload-token/server/modifiers/clearPresentationUploadToken", {
  default(v) {
    clearPresentationUploadToken = v;
  }

}, 4);

function removePresentationPod(meetingId, podId) {
  check(meetingId, String);
  check(podId, String);
  const selector = {
    meetingId,
    podId
  };

  try {
    const numberAffected = PresentationPods.remove(selector);

    if (numberAffected && podId) {
      Logger.info("Removed presentation pod id=".concat(podId, " meeting=").concat(meetingId));
      clearPresentations(meetingId, podId);
      clearPresentationUploadToken(meetingId, podId);
    }
  } catch (err) {
    Logger.error("Error on removing presentation pod from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setPresenterInPod.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/modifiers/setPresenterInPod.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setPresenterInPod
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function setPresenterInPod(meetingId, podId, nextPresenterId) {
  check(meetingId, String);
  check(podId, String);
  check(nextPresenterId, String);
  const selector = {
    meetingId,
    podId
  };
  const modifier = {
    $set: {
      currentPresenterId: nextPresenterId
    }
  };

  try {
    const {
      numberAffected
    } = PresentationPods.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Set a new presenter in pod id=".concat(podId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Setting a presenter in pod: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/eventHandlers.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleCreateNewPresentationPod;
module.link("./handlers/createNewPresentationPod", {
  default(v) {
    handleCreateNewPresentationPod = v;
  }

}, 1);
let handleRemovePresentationPod;
module.link("./handlers/removePresentationPod", {
  default(v) {
    handleRemovePresentationPod = v;
  }

}, 2);
let handleSyncGetPresentationPods;
module.link("./handlers/syncGetPresentationPods", {
  default(v) {
    handleSyncGetPresentationPods = v;
  }

}, 3);
let handleSetPresenterInPod;
module.link("./handlers/setPresenterInPod", {
  default(v) {
    handleSetPresenterInPod = v;
  }

}, 4);
RedisPubSub.on('CreateNewPresentationPodEvtMsg', handleCreateNewPresentationPod);
RedisPubSub.on('RemovePresentationPodEvtMsg', handleRemovePresentationPod);
RedisPubSub.on('SetPresenterInPodRespMsg', handleSetPresenterInPod);
RedisPubSub.on('SyncGetPresentationPodsRespMsg', handleSyncGetPresentationPods);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/index.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/server/publishers.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function presentationPods() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing PresentationPods was requested by unauth connection ".concat(this.connection.id));
    return PresentationPods.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing presentation-pods', {
    meetingId,
    userId
  });
  return PresentationPods.find({
    meetingId
  });
}

function publish() {
  const boundPresentationPods = presentationPods.bind(this);
  return boundPresentationPods(...arguments);
}

Meteor.publish('presentation-pods', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-pods/index.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const PresentationPods = new Mongo.Collection('presentation-pods');

if (Meteor.isServer) {
  // types of queries for the presentation pods:
  // 1. meetingId, podId  ( 4 )
  PresentationPods._ensureIndex({
    meetingId: 1,
    podId: 1
  });
}

module.exportDefault(PresentationPods);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"presentation-upload-token":{"server":{"handlers":{"presentationUploadTokenFail.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/handlers/presentationUploadTokenFail.js                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationUploadTokenFail
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let PresentationUploadToken;
module.link("/imports/api/presentation-upload-token", {
  default(v) {
    PresentationUploadToken = v;
  }

}, 2);

function handlePresentationUploadTokenFail(_ref, meetingId) {
  let {
    body,
    header
  } = _ref;
  check(body, Object);
  const {
    userId
  } = header;
  const {
    podId,
    filename
  } = body;
  check(userId, String);
  check(podId, String);
  check(filename, String);
  const selector = {
    meetingId,
    userId,
    podId,
    filename
  };

  try {
    const {
      numberAffected
    } = PresentationUploadToken.upsert(selector, {
      failed: true,
      authzToken: null
    });

    if (numberAffected) {
      Logger.info("Removing presentationToken filename=".concat(filename, " podId=").concat(podId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Removing presentationToken from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presentationUploadTokenPass.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/handlers/presentationUploadTokenPass.js                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationUploadTokenPass
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let PresentationUploadToken;
module.link("/imports/api/presentation-upload-token", {
  default(v) {
    PresentationUploadToken = v;
  }

}, 2);

function handlePresentationUploadTokenPass(_ref, meetingId) {
  let {
    body,
    header
  } = _ref;
  check(body, Object);
  const {
    userId
  } = header;
  const {
    podId,
    authzToken,
    filename
  } = body;
  check(userId, String);
  check(podId, String);
  check(authzToken, String);
  check(filename, String);
  const selector = {
    meetingId,
    podId,
    userId,
    filename
  };
  const modifier = {
    meetingId,
    podId,
    userId,
    filename,
    authzToken,
    failed: false,
    used: false
  };

  try {
    const {
      insertedId
    } = PresentationUploadToken.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Inserting presentationToken filename=".concat(filename, " podId=").concat(podId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Inserting presentationToken from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"requestPresentationUploadToken.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/methods/requestPresentationUploadToken.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => requestPresentationUploadToken
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function requestPresentationUploadToken(podId, filename) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'PresentationUploadTokenReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(podId, String);
  check(filename, String);
  const payload = {
    podId,
    filename
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUsedToken.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/methods/setUsedToken.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setUsedToken
});
let PresentationUploadToken;
module.link("/imports/api/presentation-upload-token", {
  default(v) {
    PresentationUploadToken = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function setUsedToken(authzToken) {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const payload = {
    $set: {
      used: true
    }
  };

  try {
    const numberAffected = PresentationUploadToken.update({
      meetingId,
      userId: requesterUserId,
      authzToken
    }, payload);

    if (numberAffected) {
      Logger.info("Token: ".concat(authzToken, " has been set as used in meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Unable to set token as used : ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearPresentationUploadToken.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/modifiers/clearPresentationUploadToken.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearPresentationUploadToken
});
let PresentationUploadToken;
module.link("/imports/api/presentation-upload-token", {
  default(v) {
    PresentationUploadToken = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearPresentationUploadToken(meetingId, podId) {
  if (meetingId && podId) {
    try {
      const numberAffected = PresentationUploadToken.remove({
        meetingId,
        podId
      });

      if (numberAffected) {
        Logger.info("Cleared Presentations Upload Token (".concat(meetingId, ", ").concat(podId, ")"));
        return true;
      }
    } catch (err) {
      Logger.info("Error on clearing Presentations Upload Token (".concat(meetingId, ", ").concat(podId, "). ").concat(err));
      return false;
    }
  }

  if (meetingId) {
    try {
      const numberAffected = PresentationUploadToken.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Presentations Upload Token (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.info("Error on clearing Presentations Upload Token (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      // clearing presentations for the whole server
      const numberAffected = PresentationUploadToken.remove({});

      if (numberAffected) {
        Logger.info('Cleared Presentations Upload Token (all)');
      }
    } catch (err) {
      Logger.info("Error on clearing Presentations Upload Token (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/eventHandlers.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 1);
let handlePresentationUploadTokenPass;
module.link("./handlers/presentationUploadTokenPass", {
  default(v) {
    handlePresentationUploadTokenPass = v;
  }

}, 2);
let handlePresentationUploadTokenFail;
module.link("./handlers/presentationUploadTokenFail", {
  default(v) {
    handlePresentationUploadTokenFail = v;
  }

}, 3);
RedisPubSub.on('PresentationUploadTokenPassRespMsg', processForHTML5ServerOnly(handlePresentationUploadTokenPass));
RedisPubSub.on('PresentationUploadTokenFailRespMsg', processForHTML5ServerOnly(handlePresentationUploadTokenFail));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/index.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/methods.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let requestPresentationUploadToken;
module.link("./methods/requestPresentationUploadToken", {
  default(v) {
    requestPresentationUploadToken = v;
  }

}, 1);
let setUsedToken;
module.link("./methods/setUsedToken", {
  default(v) {
    setUsedToken = v;
  }

}, 2);
Meteor.methods({
  requestPresentationUploadToken,
  setUsedToken
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/server/publishers.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let PresentationUploadToken;
module.link("/imports/api/presentation-upload-token", {
  default(v) {
    PresentationUploadToken = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 4);

function presentationUploadToken(podId, filename) {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing PresentationUploadToken was requested by unauth connection ".concat(this.connection.id));
    return PresentationUploadToken.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  check(podId, String);
  check(filename, String);
  const selector = {
    meetingId,
    podId,
    userId,
    filename
  };
  Logger.debug('Publishing PresentationUploadToken', {
    meetingId,
    userId
  });
  return PresentationUploadToken.find(selector);
}

function publish() {
  const boundPresentationUploadToken = presentationUploadToken.bind(this);
  return boundPresentationUploadToken(...arguments);
}

Meteor.publish('presentation-upload-token', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentation-upload-token/index.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const PresentationUploadToken = new Mongo.Collection('presentation-upload-token');
module.exportDefault(PresentationUploadToken);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"presentations":{"server":{"handlers":{"presentationAdded.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/handlers/presentationAdded.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationAdded
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addPresentation;
module.link("../modifiers/addPresentation", {
  default(v) {
    addPresentation = v;
  }

}, 1);

function handlePresentationAdded(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    presentation,
    podId
  } = body;
  check(meetingId, String);
  check(podId, String);
  check(presentation, Object);
  return addPresentation(meetingId, podId, presentation);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presentationConversionUpdate.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/handlers/presentationConversionUpdate.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationConversionUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 2);
// const OFFICE_DOC_CONVERSION_SUCCESS_KEY = 'OFFICE_DOC_CONVERSION_SUCCESS';
const OFFICE_DOC_CONVERSION_FAILED_KEY = 'OFFICE_DOC_CONVERSION_FAILED';
const OFFICE_DOC_CONVERSION_INVALID_KEY = 'OFFICE_DOC_CONVERSION_INVALID';
const SUPPORTED_DOCUMENT_KEY = 'SUPPORTED_DOCUMENT';
const UNSUPPORTED_DOCUMENT_KEY = 'UNSUPPORTED_DOCUMENT';
const PAGE_COUNT_FAILED_KEY = 'PAGE_COUNT_FAILED';
const PAGE_COUNT_EXCEEDED_KEY = 'PAGE_COUNT_EXCEEDED';
const PDF_HAS_BIG_PAGE_KEY = 'PDF_HAS_BIG_PAGE';
const GENERATED_SLIDE_KEY = 'GENERATED_SLIDE'; // const GENERATING_THUMBNAIL_KEY = 'GENERATING_THUMBNAIL';
// const GENERATED_THUMBNAIL_KEY = 'GENERATED_THUMBNAIL';
// const GENERATING_TEXTFILES_KEY = 'GENERATING_TEXTFILES';
// const GENERATED_TEXTFILES_KEY = 'GENERATED_TEXTFILES';
// const GENERATING_SVGIMAGES_KEY = 'GENERATING_SVGIMAGES';
// const GENERATED_SVGIMAGES_KEY = 'GENERATED_SVGIMAGES';
// const CONVERSION_COMPLETED_KEY = 'CONVERSION_COMPLETED';

function handlePresentationConversionUpdate(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    presentationId,
    podId,
    messageKey: status,
    presName: presentationName
  } = body;
  check(meetingId, String);
  check(presentationId, String);
  check(podId, String);
  check(status, String);
  const statusModifier = {
    'conversion.status': status,
    'conversion.error': false,
    'conversion.done': false
  };

  switch (status) {
    case SUPPORTED_DOCUMENT_KEY:
      statusModifier.id = presentationId;
      statusModifier.name = presentationName;
      break;

    case UNSUPPORTED_DOCUMENT_KEY:
    case OFFICE_DOC_CONVERSION_FAILED_KEY:
    case OFFICE_DOC_CONVERSION_INVALID_KEY:
    case PAGE_COUNT_FAILED_KEY:
    case PAGE_COUNT_EXCEEDED_KEY:
    case PDF_HAS_BIG_PAGE_KEY:
      statusModifier.id = presentationId;
      statusModifier.name = presentationName;
      statusModifier['conversion.error'] = true;
      break;

    case GENERATED_SLIDE_KEY:
      statusModifier['conversion.pagesCompleted'] = body.pagesCompleted;
      statusModifier['conversion.numPages'] = body.numberOfPages;
      break;

    default:
      break;
  }

  const selector = {
    meetingId,
    podId,
    id: presentationId
  };
  const modifier = {
    $set: Object.assign({
      meetingId,
      podId
    }, statusModifier)
  };

  try {
    const {
      insertedId
    } = Presentations.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Updated presentation conversion status=".concat(status, " id=").concat(presentationId, " meeting=").concat(meetingId));
    } else {
      Logger.debug('Upserted presentation conversion', {
        status,
        presentationId,
        meetingId
      });
    }
  } catch (err) {
    Logger.error("Updating conversion status presentation to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presentationCurrentSet.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/handlers/presentationCurrentSet.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationCurrentSet
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let setCurrentPresentation;
module.link("../modifiers/setCurrentPresentation", {
  default(v) {
    setCurrentPresentation = v;
  }

}, 1);

function handlePresentationCurrentSet(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    presentationId,
    podId
  } = body;
  check(meetingId, String);
  check(presentationId, String);
  check(podId, String);
  return setCurrentPresentation(meetingId, podId, presentationId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presentationDownloadableSet.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/handlers/presentationDownloadableSet.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationDownloadableSet
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let setPresentationDownloadable;
module.link("../modifiers/setPresentationDownloadable", {
  default(v) {
    setPresentationDownloadable = v;
  }

}, 1);

function handlePresentationDownloadableSet(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(body, Object);
  const {
    presentationId,
    podId,
    downloadable
  } = body;
  check(meetingId, String);
  check(presentationId, String);
  check(podId, String);
  check(downloadable, Boolean);
  return setPresentationDownloadable(meetingId, podId, presentationId, downloadable);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presentationRemove.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/handlers/presentationRemove.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresentationRemove
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removePresentation;
module.link("../modifiers/removePresentation", {
  default(v) {
    removePresentation = v;
  }

}, 1);

function handlePresentationRemove(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    podId,
    presentationId
  } = body;
  check(meetingId, String);
  check(podId, String);
  check(presentationId, String);
  return removePresentation(meetingId, podId, presentationId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"removePresentation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/methods/removePresentation.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removePresentation
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function removePresentation(presentationId, podId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'RemovePresentationPubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(presentationId, String);
  check(podId, String);
  const payload = {
    presentationId,
    podId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setPresentation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/methods/setPresentation.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setPresentation
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function setPresentation(presentationId, podId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SetCurrentPresentationPubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(presentationId, String);
  check(podId, String);
  const payload = {
    presentationId,
    podId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setPresentationDownloadable.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/methods/setPresentationDownloadable.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setPresentationDownloadable
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function setPresentationDownloadable(presentationId, downloadable) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SetPresentationDownloadablePubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(downloadable, Boolean);
  check(presentationId, String);
  const payload = {
    presentationId,
    podId: 'DEFAULT_PRESENTATION_POD',
    downloadable
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addPresentation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/modifiers/addPresentation.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addPresentation
});
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 4);
let addSlide;
module.link("/imports/api/slides/server/modifiers/addSlide", {
  default(v) {
    addSlide = v;
  }

}, 5);
let setCurrentPresentation;
module.link("./setCurrentPresentation", {
  default(v) {
    setCurrentPresentation = v;
  }

}, 6);

const getSlideText = url => Promise.asyncApply(() => {
  let content = '';

  try {
    content = Promise.await(HTTP.get(url).content);
  } catch (error) {
    Logger.error("No file found. ".concat(error));
  }

  return content;
});

const addSlides = (meetingId, podId, presentationId, slides) => {
  slides.forEach(slide => Promise.asyncApply(() => {
    const content = Promise.await(getSlideText(slide.txtUri));
    Object.assign(slide, {
      content
    });
    addSlide(meetingId, podId, presentationId, slide);
  }));
};

function addPresentation(meetingId, podId, presentation) {
  check(meetingId, String);
  check(podId, String);
  check(presentation, {
    id: String,
    name: String,
    current: Boolean,
    pages: [{
      id: String,
      num: Number,
      thumbUri: String,
      swfUri: String,
      txtUri: String,
      svgUri: String,
      current: Boolean,
      xOffset: Number,
      yOffset: Number,
      widthRatio: Number,
      heightRatio: Number
    }],
    downloadable: Boolean
  });
  const selector = {
    meetingId,
    podId,
    id: presentation.id
  };
  const modifier = {
    $set: Object.assign({
      meetingId,
      podId,
      'conversion.done': true,
      'conversion.error': false
    }, flat(presentation, {
      safe: true
    }))
  };

  try {
    const {
      insertedId
    } = Presentations.upsert(selector, modifier);
    addSlides(meetingId, podId, presentation.id, presentation.pages);

    if (insertedId) {
      if (presentation.current) {
        setCurrentPresentation(meetingId, podId, presentation.id);
        Logger.info("Added presentation id=".concat(presentation.id, " meeting=").concat(meetingId));
      } else {
        Logger.info("Upserted presentation id=".concat(presentation.id, " meeting=").concat(meetingId));
      }
    }
  } catch (err) {
    Logger.error("Adding presentation to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearPresentations.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/modifiers/clearPresentations.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearPresentations
});
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearPresentations(meetingId, podId) {
  // clearing presentations for 1 pod
  if (meetingId && podId) {
    try {
      const numberAffected = Presentations.remove({
        meetingId,
        podId
      });

      if (numberAffected) {
        Logger.info("Cleared Presentations (".concat(meetingId, ", ").concat(podId, ")"));
        return true;
      }
    } catch (err) {
      Logger.error("Error on cleaning Presentations (".concat(meetingId, ", ").concat(podId, "). ").concat(err));
      return false;
    }
  } // clearing presentations for the whole meeting


  if (meetingId) {
    try {
      const numberAffected = Presentations.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Presentations (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on cleaning Presentations (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = Presentations.remove({});

      if (numberAffected) {
        Logger.info('Cleared Presentations (all)');
      }
    } catch (err) {
      Logger.error("Error on cleaning Presentations (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removePresentation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/modifiers/removePresentation.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removePresentation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let clearSlidesPresentation;
module.link("/imports/api/slides/server/modifiers/clearSlidesPresentation", {
  default(v) {
    clearSlidesPresentation = v;
  }

}, 3);

function removePresentation(meetingId, podId, presentationId) {
  check(meetingId, String);
  check(presentationId, String);
  check(podId, String);
  const selector = {
    meetingId,
    podId,
    id: presentationId
  };

  try {
    const numberAffected = Presentations.remove(selector);

    if (numberAffected) {
      clearSlidesPresentation(meetingId, presentationId);
      Logger.info("Removed presentation id=".concat(presentationId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Removing presentation from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setCurrentPresentation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/modifiers/setCurrentPresentation.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setCurrentPresentation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function setCurrentPresentation(meetingId, podId, presentationId) {
  check(meetingId, String);
  check(presentationId, String);
  check(podId, String);
  const oldCurrent = {
    selector: {
      meetingId,
      podId,
      current: true
    },
    modifier: {
      $set: {
        current: false
      }
    },
    callback: err => {
      if (err) {
        Logger.error("Unsetting the current presentation: ".concat(err));
        return;
      }

      Logger.info('Unsetted as current presentation');
    }
  };
  const newCurrent = {
    selector: {
      meetingId,
      podId,
      id: presentationId
    },
    modifier: {
      $set: {
        current: true
      }
    },
    callback: err => {
      if (err) {
        Logger.error("Setting as current presentation id=".concat(presentationId, ": ").concat(err));
        return;
      }

      Logger.info("Setted as current presentation id=".concat(presentationId));
    }
  };
  const oldPresentation = Presentations.findOne(oldCurrent.selector);
  const newPresentation = Presentations.findOne(newCurrent.selector); // Prevent bug with presentation being unset, same happens in the slide
  // See: https://github.com/bigbluebutton/bigbluebutton/pull/4431

  if (oldPresentation && newPresentation && oldPresentation._id === newPresentation._id) {
    return;
  }

  if (newPresentation) {
    Presentations.update(newPresentation._id, newCurrent.modifier, newCurrent.callback);
  }

  if (oldPresentation) {
    Presentations.update(oldPresentation._id, oldCurrent.modifier, oldCurrent.callback);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setPresentationDownloadable.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/modifiers/setPresentationDownloadable.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setPresentationDownloadable
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function setPresentationDownloadable(meetingId, podId, presentationId, downloadable) {
  check(meetingId, String);
  check(presentationId, String);
  check(podId, String);
  check(downloadable, Boolean);
  const selector = {
    meetingId,
    podId,
    id: presentationId
  };
  const modifier = {
    $set: {
      downloadable
    }
  };

  try {
    const {
      numberAffected
    } = Presentations.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Set downloadable status on presentation {".concat(presentationId, " in meeting {").concat(meetingId, "}"));
    }
  } catch (err) {
    Logger.error("Could not set downloadable on pres {".concat(presentationId, " in meeting {").concat(meetingId, "} ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/eventHandlers.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handlePresentationAdded;
module.link("./handlers/presentationAdded", {
  default(v) {
    handlePresentationAdded = v;
  }

}, 1);
let handlePresentationRemove;
module.link("./handlers/presentationRemove", {
  default(v) {
    handlePresentationRemove = v;
  }

}, 2);
let handlePresentationCurrentSet;
module.link("./handlers/presentationCurrentSet", {
  default(v) {
    handlePresentationCurrentSet = v;
  }

}, 3);
let handlePresentationConversionUpdate;
module.link("./handlers/presentationConversionUpdate", {
  default(v) {
    handlePresentationConversionUpdate = v;
  }

}, 4);
let handlePresentationDownloadableSet;
module.link("./handlers/presentationDownloadableSet", {
  default(v) {
    handlePresentationDownloadableSet = v;
  }

}, 5);
RedisPubSub.on('PdfConversionInvalidErrorEvtMsg', handlePresentationConversionUpdate);
RedisPubSub.on('PresentationPageGeneratedEvtMsg', handlePresentationConversionUpdate);
RedisPubSub.on('PresentationPageCountErrorEvtMsg', handlePresentationConversionUpdate);
RedisPubSub.on('PresentationConversionUpdateEvtMsg', handlePresentationConversionUpdate);
RedisPubSub.on('PresentationConversionCompletedEvtMsg', handlePresentationAdded);
RedisPubSub.on('RemovePresentationEvtMsg', handlePresentationRemove);
RedisPubSub.on('SetCurrentPresentationEvtMsg', handlePresentationCurrentSet);
RedisPubSub.on('SetPresentationDownloadableEvtMsg', handlePresentationDownloadableSet);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/index.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/methods.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let removePresentation;
module.link("./methods/removePresentation", {
  default(v) {
    removePresentation = v;
  }

}, 1);
let setPresentation;
module.link("./methods/setPresentation", {
  default(v) {
    setPresentation = v;
  }

}, 2);
let setPresentationDownloadable;
module.link("./methods/setPresentationDownloadable", {
  default(v) {
    setPresentationDownloadable = v;
  }

}, 3);
Meteor.methods({
  removePresentation,
  setPresentation,
  setPresentationDownloadable
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/server/publishers.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function presentations() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Presentation was requested by unauth connection ".concat(this.connection.id));
    return Presentations.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Presentations', {
    meetingId,
    userId
  });
  return Presentations.find({
    meetingId
  });
}

function publish() {
  const boundPresentations = presentations.bind(this);
  return boundPresentations(...arguments);
}

Meteor.publish('presentations', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/presentations/index.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Presentations = new Mongo.Collection('presentations');

if (Meteor.isServer) {
  // types of queries for the presentations:
  // 1. meetingId, podId, id        ( 3 )
  // 2. meetingId, id               ( 1 )
  // 3. meetingId, id, current      ( 2 )
  // 4. meetingId                   ( 1 )
  Presentations._ensureIndex({
    meetingId: 1,
    podId: 1,
    id: 1
  });
}

module.exportDefault(Presentations);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"screenshare":{"server":{"handlers":{"screenshareStarted.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/handlers/screenshareStarted.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleScreenshareStarted
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 1);
let addScreenshare;
module.link("../modifiers/addScreenshare", {
  default(v) {
    addScreenshare = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let stopWatchingExternalVideoSystemCall;
module.link("/imports/api/external-videos/server/methods/stopWatchingExternalVideoSystemCall", {
  default(v) {
    stopWatchingExternalVideoSystemCall = v;
  }

}, 4);

function handleScreenshareStarted(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(meetingId, String);
  check(body, Object);
  const meeting = Meetings.findOne({
    meetingId
  });

  if (meeting && meeting.externalVideoUrl) {
    Logger.info("ScreenshareStarted: There is external video being shared. Stopping it due to presenter change, ".concat(meeting.externalVideoUrl));
    stopWatchingExternalVideoSystemCall({
      meetingId,
      requesterUserId: 'system-screenshare-starting'
    });
  }

  return addScreenshare(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"screenshareStopped.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/handlers/screenshareStopped.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleScreenshareStopped
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let clearScreenshare;
module.link("../modifiers/clearScreenshare", {
  default(v) {
    clearScreenshare = v;
  }

}, 1);

function handleScreenshareStopped(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    screenshareConf
  } = body;
  check(meetingId, String);
  check(screenshareConf, String);
  return clearScreenshare(meetingId, screenshareConf);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addScreenshare.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/modifiers/addScreenshare.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addScreenshare
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let Screenshare;
module.link("/imports/api/screenshare", {
  default(v) {
    Screenshare = v;
  }

}, 3);

function addScreenshare(meetingId, body) {
  check(meetingId, String);
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      meetingId,
      screenshare: flat(body)
    }
  };

  try {
    const {
      numberAffected
    } = Screenshare.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Upserted screenshare id=".concat(body.screenshareConf));
    }
  } catch (err) {
    Logger.error("Adding screenshare to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearScreenshare.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/modifiers/clearScreenshare.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearScreenshare
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Screenshare;
module.link("/imports/api/screenshare", {
  default(v) {
    Screenshare = v;
  }

}, 1);

function clearScreenshare(meetingId, screenshareConf) {
  try {
    let numberAffected;

    if (meetingId && screenshareConf) {
      numberAffected = Screenshare.remove({
        meetingId,
        'screenshare.screenshareConf': screenshareConf
      });
    } else if (meetingId) {
      numberAffected = Screenshare.remove({
        meetingId
      });
    } else {
      numberAffected = Screenshare.remove({});
    }

    if (numberAffected) {
      Logger.info("removed screenshare meetingId=".concat(meetingId, " id=").concat(screenshareConf));
    }
  } catch (err) {
    Logger.error("removing screenshare to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/eventHandlers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleScreenshareStarted;
module.link("./handlers/screenshareStarted", {
  default(v) {
    handleScreenshareStarted = v;
  }

}, 1);
let handleScreenshareStopped;
module.link("./handlers/screenshareStopped", {
  default(v) {
    handleScreenshareStopped = v;
  }

}, 2);
RedisPubSub.on('ScreenshareRtmpBroadcastStartedEvtMsg', handleScreenshareStarted);
RedisPubSub.on('ScreenshareRtmpBroadcastStoppedEvtMsg', handleScreenshareStopped);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/index.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/methods.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
Meteor.methods({});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/server/publishers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Screenshare;
module.link("/imports/api/screenshare", {
  default(v) {
    Screenshare = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function screenshare() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Screenshare was requested by unauth connection ".concat(this.connection.id));
    return Screenshare.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Screenshare', {
    meetingId,
    userId
  });
  return Screenshare.find({
    meetingId
  });
}

function publish() {
  const boundScreenshare = screenshare.bind(this);
  return boundScreenshare(...arguments);
}

Meteor.publish('screenshare', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/screenshare/index.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Screenshare = new Mongo.Collection('screenshare');

if (Meteor.isServer) {
  // types of queries for the screenshare:
  // 1. meetingId
  Screenshare._ensureIndex({
    meetingId: 1
  });
}

module.exportDefault(Screenshare);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"slides":{"server":{"handlers":{"slideChange.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/handlers/slideChange.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleSlideChange
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let changeCurrentSlide;
module.link("../modifiers/changeCurrentSlide", {
  default(v) {
    changeCurrentSlide = v;
  }

}, 1);

function handleSlideChange(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    pageId,
    presentationId,
    podId
  } = body;
  check(pageId, String);
  check(presentationId, String);
  check(podId, String);
  return changeCurrentSlide(meetingId, podId, presentationId, pageId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slideResize.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/handlers/slideResize.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleSlideResize
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let resizeSlide;
module.link("../modifiers/resizeSlide", {
  default(v) {
    resizeSlide = v;
  }

}, 1);

function handleSlideResize(_ref, meetingId) {
  let {
    body
  } = _ref;
  check(meetingId, String);
  check(body, Object);
  return resizeSlide(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"switchSlide.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/methods/switchSlide.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => switchSlide
});
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 0);
let Slides;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 3);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 4);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 5);

function switchSlide(slideNumber, podId) {
  // TODO-- send presentationId and SlideId
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SetCurrentPagePubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(slideNumber, Number);
  const selector = {
    meetingId,
    podId,
    current: true
  };
  const Presentation = Presentations.findOne(selector);

  if (!Presentation) {
    throw new Meteor.Error('presentation-not-found', 'You need a presentation to be able to switch slides');
  }

  const Slide = Slides.findOne({
    meetingId,
    podId,
    presentationId: Presentation.id,
    num: slideNumber
  });

  if (!Slide) {
    throw new Meteor.Error('slide-not-found', "Slide number ".concat(slideNumber, " not found in the current presentation"));
  }

  const payload = {
    podId,
    presentationId: Presentation.id,
    pageId: Slide.id
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"zoomSlide.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/methods/zoomSlide.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => zoomSlide
});
let Presentations;
module.link("/imports/api/presentations", {
  default(v) {
    Presentations = v;
  }

}, 0);
let Slides;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function zoomSlide(slideNumber, podId, widthRatio, heightRatio, x, y) {
  // TODO-- send presentationId and SlideId
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ResizeAndMovePagePubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const selector = {
    meetingId,
    podId,
    current: true
  };
  const Presentation = Presentations.findOne(selector);

  if (!Presentation) {
    throw new Meteor.Error('presentation-not-found', 'You need a presentation to be able to switch slides');
  }

  const Slide = Slides.findOne({
    meetingId,
    podId,
    presentationId: Presentation.id,
    num: slideNumber
  });

  if (!Slide) {
    throw new Meteor.Error('slide-not-found', "Slide number ".concat(slideNumber, " not found in the current presentation"));
  }

  const payload = {
    podId,
    presentationId: Presentation.id,
    pageId: Slide.id,
    xOffset: x,
    yOffset: y,
    widthRatio,
    heightRatio
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addSlide.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/modifiers/addSlide.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectWithoutProperties;

module.link("@babel/runtime/helpers/objectWithoutProperties", {
  default(v) {
    _objectWithoutProperties = v;
  }

}, 0);
module.export({
  default: () => addSlide
});
let probe;
module.link("probe-image-size", {
  default(v) {
    probe = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 3);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 4);
let Slides;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  }

}, 5);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 6);
let SVG, PNG;
module.link("/imports/utils/mimeTypes", {
  SVG(v) {
    SVG = v;
  },

  PNG(v) {
    PNG = v;
  }

}, 7);
let calculateSlideData;
module.link("/imports/api/slides/server/helpers", {
  default(v) {
    calculateSlideData = v;
  }

}, 8);
let addSlidePositions;
module.link("./addSlidePositions", {
  default(v) {
    addSlidePositions = v;
  }

}, 9);
const loadSlidesFromHttpAlways = Meteor.settings.private.app.loadSlidesFromHttpAlways || false;

const requestWhiteboardHistory = (meetingId, slideId) => {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'GetWhiteboardAnnotationsReqMsg';
  const USER_ID = 'nodeJSapp';
  const payload = {
    whiteboardId: slideId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, USER_ID, payload);
};

const SUPPORTED_TYPES = [SVG, PNG];

const fetchImageSizes = imageUri => probe(imageUri).then(result => {
  if (!SUPPORTED_TYPES.includes(result.mime)) {
    throw new Meteor.Error('invalid-image-type', "received ".concat(result.mime, " expecting ").concat(SUPPORTED_TYPES.join()));
  }

  return {
    width: result.width,
    height: result.height
  };
}).catch(reason => {
  Logger.error("Error parsing image size. ".concat(reason, ". uri=").concat(imageUri));
  return reason;
});

function addSlide(meetingId, podId, presentationId, slide) {
  check(podId, String);
  check(presentationId, String);
  check(slide, {
    id: String,
    num: Number,
    thumbUri: String,
    swfUri: String,
    txtUri: String,
    svgUri: String,
    current: Boolean,
    xOffset: Number,
    yOffset: Number,
    widthRatio: Number,
    heightRatio: Number,
    content: String
  });

  const {
    id: slideId,
    xOffset,
    yOffset,
    widthRatio,
    heightRatio
  } = slide,
        restSlide = _objectWithoutProperties(slide, ["id", "xOffset", "yOffset", "widthRatio", "heightRatio"]);

  const selector = {
    meetingId,
    podId,
    presentationId,
    id: slideId
  };
  const imageUri = slide.svgUri || slide.pngUri;
  const modifier = {
    $set: Object.assign({
      meetingId
    }, {
      podId
    }, {
      presentationId
    }, {
      id: slideId
    }, {
      imageUri
    }, flat(restSlide), {
      safe: true
    })
  };
  const imageSizeUri = loadSlidesFromHttpAlways ? imageUri.replace(/^https/i, 'http') : imageUri;
  return fetchImageSizes(imageSizeUri).then((_ref) => {
    let {
      width,
      height
    } = _ref;

    // there is a rare case when for a very long not-active meeting the presentation
    // files just disappear and width/height can't be retrieved
    if (width && height) {
      // pre-calculating the width, height, and vieBox coordinates / dimensions
      // to unload the client-side
      const slideData = {
        width,
        height,
        xOffset,
        yOffset,
        widthRatio,
        heightRatio
      };
      const slidePosition = calculateSlideData(slideData);
      addSlidePositions(meetingId, podId, presentationId, slideId, slidePosition);
    }

    try {
      const {
        insertedId,
        numberAffected
      } = Slides.upsert(selector, modifier);
      requestWhiteboardHistory(meetingId, slideId);

      if (insertedId) {
        Logger.info("Added slide id=".concat(slideId, " pod=").concat(podId, " presentation=").concat(presentationId));
      } else if (numberAffected) {
        Logger.info("Upserted slide id=".concat(slideId, " pod=").concat(podId, " presentation=").concat(presentationId));
      }
    } catch (err) {
      Logger.error("Error on adding slide to collection: ".concat(err));
    }
  }).catch(reason => Logger.error("Error parsing image size. ".concat(reason, ". slide=").concat(slideId, " uri=").concat(imageUri)));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addSlidePositions.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/modifiers/addSlidePositions.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addSlidePositions
});
let SlidePositions;
module.link("/imports/api/slides", {
  SlidePositions(v) {
    SlidePositions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 3);

function addSlidePositions(meetingId, podId, presentationId, slideId, slidePosition) {
  check(meetingId, String);
  check(podId, String);
  check(presentationId, String);
  check(slideId, String);
  check(slidePosition, {
    width: Number,
    height: Number,
    x: Number,
    y: Number,
    viewBoxWidth: Number,
    viewBoxHeight: Number
  });
  const selector = {
    meetingId,
    podId,
    presentationId,
    id: slideId
  };
  const modifier = {
    $set: Object.assign({
      meetingId
    }, {
      podId
    }, {
      presentationId
    }, {
      id: slideId
    }, flat(slidePosition), {
      safe: true
    })
  };

  try {
    const {
      insertedId
    } = SlidePositions.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added slide position id=".concat(slideId, " pod=").concat(podId, " presentation=").concat(presentationId));
    } else {
      Logger.info("Upserted slide position id=".concat(slideId, " pod=").concat(podId, " presentation=").concat(presentationId));
    }
  } catch (err) {
    Logger.error("Adding slide position to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeCurrentSlide.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/modifiers/changeCurrentSlide.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeCurrentSlide
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Slides;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function changeCurrentSlide(meetingId, podId, presentationId, slideId) {
  check(meetingId, String);
  check(presentationId, String);
  check(slideId, String);
  check(podId, String);
  const oldCurrent = {
    selector: {
      meetingId,
      podId,
      presentationId,
      current: true
    },
    modifier: {
      $set: {
        current: false
      }
    },
    callback: err => {
      if (err) {
        Logger.error("Unsetting the current slide: ".concat(err));
        return;
      }

      Logger.info('Unsetted the current slide');
    }
  };
  const newCurrent = {
    selector: {
      meetingId,
      podId,
      presentationId,
      id: slideId
    },
    modifier: {
      $set: {
        current: true
      }
    },
    callback: err => {
      if (err) {
        Logger.error("Setting as current slide id=".concat(slideId, ": ").concat(err));
        return;
      }

      Logger.info("Setted as current slide id=".concat(slideId));
    }
  };
  const oldSlide = Slides.findOne(oldCurrent.selector);
  const newSlide = Slides.findOne(newCurrent.selector); // if the oldCurrent and newCurrent have the same ids

  if (oldSlide && newSlide && oldSlide._id === newSlide._id) {
    return;
  }

  if (newSlide) {
    Slides.update(newSlide._id, newCurrent.modifier, newCurrent.callback);
  }

  if (oldSlide) {
    Slides.update(oldSlide._id, oldCurrent.modifier, oldCurrent.callback);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearSlides.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/modifiers/clearSlides.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearSlides
});
let Slides, SlidePositions;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  },

  SlidePositions(v) {
    SlidePositions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearSlides(meetingId) {
  if (meetingId) {
    try {
      const numberAffectedSlidePositions = SlidePositions.remove({
        meetingId
      });
      const numberAffected = Slides.remove({
        meetingId
      });

      if (numberAffectedSlidePositions) {
        Logger.info("Cleared SlidePositions (".concat(meetingId, ")"));
      }

      if (numberAffected) {
        Logger.info("Cleared Slides (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on cleaning Slides (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffectedSlidePositions = SlidePositions.remove({
        meetingId
      });
      const numberAffected = Slides.remove({
        meetingId
      });

      if (numberAffectedSlidePositions) {
        Logger.info("Cleared SlidePositions (".concat(meetingId, ")"));
      }

      if (numberAffected) {
        Logger.info('Cleared Slides (all)');
      }
    } catch (err) {
      Logger.error("Error on cleaning Slides (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearSlidesPresentation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/modifiers/clearSlidesPresentation.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearSlidesPresentation
});
let Slides, SlidePositions;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  },

  SlidePositions(v) {
    SlidePositions = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let clearAnnotations;
module.link("/imports/api/annotations/server/modifiers/clearAnnotations", {
  default(v) {
    clearAnnotations = v;
  }

}, 3);

function clearSlidesPresentation(meetingId, presentationId) {
  check(meetingId, String);
  check(presentationId, String);
  const selector = {
    meetingId,
    presentationId
  };
  const whiteboardIds = Slides.find(selector, {
    fields: {
      id: 1
    }
  }).map(row => row.id);

  try {
    SlidePositions.remove(selector);
    const numberAffected = Slides.remove(selector);

    if (numberAffected) {
      whiteboardIds.forEach(whiteboardId => clearAnnotations(meetingId, whiteboardId));
      Logger.info("Removed Slides where presentationId=".concat(presentationId));
    }
  } catch (err) {
    Logger.error("Removing Slides from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"resizeSlide.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/modifiers/resizeSlide.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => resizeSlide
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let SlidePositions;
module.link("/imports/api/slides", {
  SlidePositions(v) {
    SlidePositions = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let calculateSlideData;
module.link("/imports/api/slides/server/helpers", {
  default(v) {
    calculateSlideData = v;
  }

}, 3);

function resizeSlide(meetingId, slide) {
  check(meetingId, String);
  const {
    podId,
    presentationId,
    pageId,
    widthRatio,
    heightRatio,
    xOffset,
    yOffset
  } = slide;
  const selector = {
    meetingId,
    podId,
    presentationId,
    id: pageId
  }; // fetching the current slide data
  // and pre-calculating the width, height, and vieBox coordinates / sizes
  // to reduce the client-side load

  const SlidePosition = SlidePositions.findOne(selector);

  if (SlidePosition) {
    const {
      width,
      height
    } = SlidePosition;
    const slideData = {
      width,
      height,
      xOffset,
      yOffset,
      widthRatio,
      heightRatio
    };
    const calculatedData = calculateSlideData(slideData);
    const modifier = {
      $set: calculatedData
    };

    try {
      const numberAffected = SlidePositions.update(selector, modifier);

      if (numberAffected) {
        Logger.debug("Resized slide positions id=".concat(pageId));
      } else {
        Logger.info("No slide positions found with id=".concat(pageId));
      }
    } catch (err) {
      Logger.error("Resizing slide positions id=".concat(pageId, ": ").concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/eventHandlers.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleSlideResize;
module.link("./handlers/slideResize", {
  default(v) {
    handleSlideResize = v;
  }

}, 1);
let handleSlideChange;
module.link("./handlers/slideChange", {
  default(v) {
    handleSlideChange = v;
  }

}, 2);
RedisPubSub.on('ResizeAndMovePageEvtMsg', handleSlideResize);
RedisPubSub.on('SetCurrentPageEvtMsg', handleSlideChange);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/helpers.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const calculateSlideData = slideData => {
  const {
    width,
    height,
    xOffset,
    yOffset,
    widthRatio,
    heightRatio
  } = slideData; // calculating viewBox and offsets for the current presentation

  return {
    width,
    height,
    x: -xOffset * 2 * width / 100,
    y: -yOffset * 2 * height / 100,
    viewBoxWidth: width * widthRatio / 100,
    viewBoxHeight: height * heightRatio / 100
  };
};

module.exportDefault(calculateSlideData);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/index.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/methods.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let switchSlide;
module.link("./methods/switchSlide", {
  default(v) {
    switchSlide = v;
  }

}, 1);
let zoomSlide;
module.link("./methods/zoomSlide", {
  default(v) {
    zoomSlide = v;
  }

}, 2);
Meteor.methods({
  switchSlide,
  zoomSlide
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/server/publishers.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Slides, SlidePositions;
module.link("/imports/api/slides", {
  Slides(v) {
    Slides = v;
  },

  SlidePositions(v) {
    SlidePositions = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function slides() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Slides was requested by unauth connection ".concat(this.connection.id));
    return Slides.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Slides', {
    meetingId,
    userId
  });
  return Slides.find({
    meetingId
  });
}

function publish() {
  const boundSlides = slides.bind(this);
  return boundSlides(...arguments);
}

Meteor.publish('slides', publish);

function slidePositions() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing SlidePositions was requested by unauth connection ".concat(this.connection.id));
    return SlidePositions.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing SlidePositions', {
    meetingId,
    userId
  });
  return SlidePositions.find({
    meetingId
  });
}

function publishPositions() {
  const boundSlidePositions = slidePositions.bind(this);
  return boundSlidePositions(...arguments);
}

Meteor.publish('slide-positions', publishPositions);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/slides/index.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Slides: () => Slides,
  SlidePositions: () => SlidePositions
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Slides = new Mongo.Collection('slides');
const SlidePositions = new Mongo.Collection('slide-positions');

if (Meteor.isServer) {
  // types of queries for the slides:
  // 1. meetingId                                  ( 1 )
  // 2. meetingId, podId                           ( 1 )
  // 3. meetingId, presentationId                  ( 1 )
  // 3. meetingId, presentationId, num             ( 1 )
  // 4. meetingId, podId, presentationId, id       ( 3 ) - incl. resizeSlide, which can be intense
  // 5. meetingId, podId, presentationId, current  ( 1 )
  Slides._ensureIndex({
    meetingId: 1,
    podId: 1,
    presentationId: 1,
    id: 1
  });

  SlidePositions._ensureIndex({
    meetingId: 1,
    podId: 1,
    presentationId: 1,
    id: 1
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"server":{"handlers":{"changeRole.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/changeRole.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleChangeRole
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let changeRole;
module.link("/imports/api/users/server/modifiers/changeRole", {
  default(v) {
    changeRole = v;
  }

}, 1);

function handleChangeRole(payload, meetingId) {
  check(payload.body, Object);
  check(meetingId, String);
  const {
    userId,
    role,
    changedBy
  } = payload.body;
  changeRole(role, userId, meetingId, changedBy);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"emojiStatus.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/emojiStatus.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleEmojiStatus
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);

function handleEmojiStatus(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    userId,
    emoji
  } = body;
  check(userId, String);
  check(emoji, String);
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      emojiTime: new Date().getTime(),
      emoji
    }
  };

  try {
    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Assigned user emoji status ".concat(emoji, " id=").concat(userId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Assigning user emoji status: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"presenterAssigned.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/presenterAssigned.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handlePresenterAssigned
});
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 0);
let PresentationPods;
module.link("/imports/api/presentation-pods", {
  default(v) {
    PresentationPods = v;
  }

}, 1);
let changePresenter;
module.link("/imports/api/users/server/modifiers/changePresenter", {
  default(v) {
    changePresenter = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);

function setPresenterInPodReqMsg(credentials) {
  // TODO-- switch to meetingId, etc
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SetPresenterInPodReqMsg';
  const {
    meetingId,
    requesterUserId,
    presenterId
  } = credentials;
  const payload = {
    podId: 'DEFAULT_PRESENTATION_POD',
    nextPresenterId: presenterId
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}

function handlePresenterAssigned(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    presenterId,
    assignedBy
  } = body;
  changePresenter(true, presenterId, meetingId, assignedBy);
  const selector = {
    meetingId,
    userId: {
      $ne: presenterId
    },
    presenter: true
  };
  const prevPresenter = Users.findOne(selector); // no previous presenters
  // The below code is responsible for set Meeting presenter to be default pod presenter as well.
  // It's been handled here because right now akka-apps don't handle all cases scenarios.

  if (!prevPresenter) {
    const setPresenterPayload = {
      meetingId,
      requesterUserId: assignedBy,
      presenterId
    };
    const defaultPodSelector = {
      meetingId,
      podId: 'DEFAULT_PRESENTATION_POD'
    };
    const currentDefaultPodPresenter = PresentationPods.findOne(defaultPodSelector);
    const {
      currentPresenterId
    } = currentDefaultPodPresenter;

    if (currentPresenterId === '') {
      return setPresenterInPodReqMsg(setPresenterPayload);
    }

    const oldPresenter = Users.findOne({
      meetingId,
      userId: currentPresenterId
    });

    if ((oldPresenter === null || oldPresenter === void 0 ? void 0 : oldPresenter.userId) !== currentPresenterId) {
      return setPresenterInPodReqMsg(setPresenterPayload);
    }

    return true;
  }

  changePresenter(false, prevPresenter.userId, meetingId, assignedBy);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/removeUser.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleRemoveUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removeUser;
module.link("../modifiers/removeUser", {
  default(v) {
    removeUser = v;
  }

}, 1);

function handleRemoveUser(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    intId
  } = body;
  check(meetingId, String);
  check(intId, String);
  return removeUser(meetingId, intId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userEjected.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/userEjected.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleEjectedUser
});
let userEjected;
module.link("../modifiers/userEjected", {
  default(v) {
    userEjected = v;
  }

}, 0);

function handleEjectedUser(_ref) {
  let {
    header,
    body
  } = _ref;
  const {
    meetingId,
    userId
  } = header;
  const {
    reasonCode
  } = body;
  userEjected(meetingId, userId, reasonCode);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userInactivityInspect.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/userInactivityInspect.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUserInactivityInspect
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let userInactivityInspect;
module.link("../modifiers/userInactivityInspect", {
  default(v) {
    userInactivityInspect = v;
  }

}, 1);

function handleUserInactivityInspect(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId
  } = header;
  const {
    responseDelay
  } = body;
  check(userId, String);
  check(responseDelay, Match.Integer);
  check(meetingId, String);
  userInactivityInspect(userId, responseDelay);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userJoin.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/userJoin.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userJoin
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);

function userJoin(meetingId, userId, authToken) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserJoinMeetingReqMsg';
  check(authToken, String);
  const payload = {
    userId,
    authToken,
    clientType: 'HTML5'
  };
  Logger.info("User='".concat(userId, "' is joining meeting='").concat(meetingId, "' authToken='").concat(authToken, "'"));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userJoined.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/userJoined.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUserJoined
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addUser;
module.link("../modifiers/addUser", {
  default(v) {
    addUser = v;
  }

}, 1);

function handleUserJoined(_ref, meetingId) {
  let {
    body
  } = _ref;
  const user = body;
  check(user, Object);
  addUser(meetingId, user);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateAuthToken.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/handlers/validateAuthToken.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleValidateAuthToken
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let userJoin;
module.link("./userJoin", {
  default(v) {
    userJoin = v;
  }

}, 3);
let pendingAuthenticationsStore;
module.link("../store/pendingAuthentications", {
  default(v) {
    pendingAuthenticationsStore = v;
  }

}, 4);
let createDummyUser;
module.link("../modifiers/createDummyUser", {
  default(v) {
    createDummyUser = v;
  }

}, 5);
let ClientConnections;
module.link("/imports/startup/server/ClientConnections", {
  default(v) {
    ClientConnections = v;
  }

}, 6);
let upsertValidationState;
module.link("/imports/api/auth-token-validation/server/modifiers/upsertValidationState", {
  default(v) {
    upsertValidationState = v;
  }

}, 7);
let ValidationStates;
module.link("/imports/api/auth-token-validation", {
  ValidationStates(v) {
    ValidationStates = v;
  }

}, 8);

const clearOtherSessions = function (sessionUserId) {
  let current = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  const serverSessions = Meteor.server.sessions;
  Object.keys(serverSessions).filter(i => serverSessions[i].userId === sessionUserId).filter(i => i !== current).forEach(i => serverSessions[i].close());
};

function handleValidateAuthToken(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    userId,
    valid,
    authToken,
    waitForApproval,
    registeredOn,
    authTokenValidatedOn
  } = body;
  check(userId, String);
  check(authToken, String);
  check(valid, Boolean);
  check(waitForApproval, Boolean);
  check(registeredOn, Number);
  check(authTokenValidatedOn, Number);
  const pendingAuths = pendingAuthenticationsStore.take(meetingId, userId, authToken);
  Logger.info("PendingAuths length [".concat(pendingAuths.length, "]"));
  if (pendingAuths.length === 0) return;

  if (!valid) {
    pendingAuths.forEach(pendingAuth => {
      try {
        const {
          methodInvocationObject
        } = pendingAuth;
        const connectionId = methodInvocationObject.connection.id;
        upsertValidationState(meetingId, userId, ValidationStates.INVALID, connectionId); // Schedule socket disconnection for this user, giving some time for client receiving the reason of disconnection

        Meteor.setTimeout(() => {
          methodInvocationObject.connection.close();
        }, 2000);
        Logger.info("Closed connection ".concat(connectionId, " due to invalid auth token."));
      } catch (e) {
        Logger.error("Error closing socket for meetingId '".concat(meetingId, "', userId '").concat(userId, "', authToken ").concat(authToken));
      }
    });
    return;
  }

  if (valid) {
    // Define user ID on connections
    pendingAuths.forEach(pendingAuth => {
      const {
        methodInvocationObject
      } = pendingAuth;
      /* Logic migrated from validateAuthToken method ( postponed to only run in case of success response ) - Begin */

      const sessionId = "".concat(meetingId, "--").concat(userId);
      methodInvocationObject.setUserId(sessionId);
      const User = Users.findOne({
        meetingId,
        userId
      });

      if (!User) {
        createDummyUser(meetingId, userId, authToken);
      }

      ClientConnections.add(sessionId, methodInvocationObject.connection);
      upsertValidationState(meetingId, userId, ValidationStates.VALIDATED, methodInvocationObject.connection.id);
      /* End of logic migrated from validateAuthToken */
    });
  }

  const selector = {
    meetingId,
    userId,
    clientType: 'HTML5'
  };
  const User = Users.findOne(selector); // If we dont find the user on our collection is a flash user and we can skip

  if (!User) return; // Publish user join message

  if (valid && !waitForApproval) {
    Logger.info('User=', User);
    userJoin(meetingId, userId, User.authToken);
  }

  const modifier = {
    $set: {
      validated: valid,
      approved: !waitForApproval,
      loginTime: registeredOn,
      authTokenValidatedTime: authTokenValidatedOn,
      inactivityCheck: false
    }
  };

  try {
    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      if (valid) {
        const sessionUserId = "".concat(meetingId, "-").concat(userId);
        const currentConnectionId = User.connectionId ? User.connectionId : false;
        clearOtherSessions(sessionUserId, currentConnectionId);
      }

      Logger.info("Validated auth token as ".concat(valid, " user=").concat(userId, " meeting=").concat(meetingId));
    } else {
      Logger.info('No auth to validate');
    }
  } catch (err) {
    Logger.error("Validating auth token: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"assignPresenter.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/assignPresenter.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => assignPresenter
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 4);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 5);

function assignPresenter(userId) {
  // TODO-- send username from client side
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'AssignPresenterReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(userId, String);
  const User = Users.findOne({
    meetingId,
    userId
  });

  if (!User) {
    throw new Meteor.Error('user-not-found', 'You need a valid user to be able to set presenter');
  }

  const payload = {
    newPresenterId: userId,
    newPresenterName: User.name,
    assignedBy: requesterUserId,
    requesterId: requesterUserId
  };
  Logger.verbose('User set as presenter', {
    userId,
    meetingId,
    setBy: requesterUserId
  });
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeRole.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/changeRole.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeRole
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function changeRole(userId, role) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ChangeUserRoleCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(userId, String);
  check(role, String);
  const payload = {
    userId,
    role,
    changedBy: requesterUserId
  };
  Logger.verbose('Changed user role', {
    userId,
    role,
    changedBy: requesterUserId,
    meetingId
  });
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/removeUser.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removeUser
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 4);
let BannedUsers;
module.link("/imports/api/users/server/store/bannedUsers", {
  default(v) {
    BannedUsers = v;
  }

}, 5);

function removeUser(userId, banUser) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'EjectUserFromMeetingCmdMsg';
  const {
    meetingId,
    requesterUserId: ejectedBy
  } = extractCredentials(this.userId);
  check(userId, String);
  const payload = {
    userId,
    ejectedBy,
    banUser
  };
  const removedUser = Users.findOne({
    meetingId,
    userId
  }, {
    extId: 1
  });
  if (banUser && removedUser) BannedUsers.add(meetingId, removedUser.extId);
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, ejectedBy, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setEmojiStatus.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/setEmojiStatus.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setEmojiStatus
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function setEmojiStatus(userId, status) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ChangeUserEmojiCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(userId, String);
  const payload = {
    emoji: status,
    userId
  };
  Logger.verbose('User emoji status updated', {
    userId,
    status,
    requesterUserId,
    meetingId
  });
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setMobileUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/setMobileUser.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setMobileUser
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let setMobile;
module.link("../modifiers/setMobile", {
  default(v) {
    setMobile = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function setMobileUser() {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(meetingId, String);
  check(requesterUserId, String);
  Logger.verbose("Mobile user ".concat(requesterUserId, " from meeting ").concat(meetingId));
  setMobile(meetingId, requesterUserId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setRandomUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/setRandomUser.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setRandomUser
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function setRandomUser() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'SelectRandomViewerReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const payload = {
    requestedBy: requesterUserId
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUserEffectiveConnectionType.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/setUserEffectiveConnectionType.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setUserEffectiveConnectionType
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
let setEffectiveConnectionType;
module.link("../modifiers/setUserEffectiveConnectionType", {
  default(v) {
    setEffectiveConnectionType = v;
  }

}, 5);

function setUserEffectiveConnectionType(effectiveConnectionType) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ChangeUserEffectiveConnectionMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(effectiveConnectionType, String);
  const payload = {
    meetingId,
    userId: requesterUserId,
    effectiveConnectionType
  };
  setEffectiveConnectionType(meetingId, requesterUserId, effectiveConnectionType);
  Logger.verbose('Updated user effective connection', {
    requesterUserId,
    effectiveConnectionType
  });
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toggleUserLock.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/toggleUserLock.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => toggleUserLock
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function toggleUserLock(userId, lock) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'LockUserInMeetingCmdMsg';
  const {
    meetingId,
    requesterUserId: lockedBy
  } = extractCredentials(this.userId);
  check(lockedBy, String);
  check(userId, String);
  check(lock, Boolean);
  const payload = {
    lockedBy,
    userId,
    lock
  };
  Logger.verbose('Updated lock status for user', {
    meetingId,
    userId,
    lock,
    lockedBy
  });
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, lockedBy, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userActivitySign.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/userActivitySign.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userActivitySign
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function userActivitySign() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserActivitySignCmdMsg';
  const {
    meetingId,
    requesterUserId: userId
  } = extractCredentials(this.userId);
  const payload = {
    userId
  };
  const selector = {
    userId
  };
  const modifier = {
    $set: {
      inactivityCheck: false
    }
  };
  Users.update(selector, modifier); // TODO-- we should move this to a modifier

  Logger.info("User ".concat(userId, " sent a activity sign for meeting ").concat(meetingId));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userLeaving.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/userLeaving.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userLeaving
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let AuthTokenValidation;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  }

}, 4);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 5);
let ClientConnections;
module.link("/imports/startup/server/ClientConnections", {
  default(v) {
    ClientConnections = v;
  }

}, 6);

function userLeaving(meetingId, userId, connectionId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserLeaveReqMsg';
  check(userId, String);
  const selector = {
    meetingId,
    userId
  };
  const user = Users.findOne(selector);

  if (!user) {
    Logger.info("Skipping userLeaving. Could not find ".concat(userId, " in ").concat(meetingId));
    return;
  }

  const auth = AuthTokenValidation.findOne({
    meetingId,
    userId
  }, {
    sort: {
      updatedAt: -1
    }
  }); // If the current user connection is not the same that triggered the leave we skip

  if ((auth === null || auth === void 0 ? void 0 : auth.connectionId) !== connectionId) {
    Logger.info("Skipping userLeaving. User connectionId=".concat(user.connectionId, " is different from requester connectionId=").concat(connectionId));
    return false;
  }

  const payload = {
    userId,
    sessionId: meetingId,
    loggedOut: user.loggedOut
  };
  ClientConnections.removeClientConnection("".concat(meetingId, "--").concat(userId), connectionId);
  Logger.info("User '".concat(userId, "' is leaving meeting '").concat(meetingId, "'"));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userLeftMeeting.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/userLeftMeeting.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userLeftMeeting
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);
let ClientConnections;
module.link("/imports/startup/server/ClientConnections", {
  default(v) {
    ClientConnections = v;
  }

}, 3);

function userLeftMeeting() {
  // TODO-- spread the code to method/modifier/handler
  // so we don't update the db in a method
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const selector = {
    meetingId,
    userId: requesterUserId
  };

  try {
    const numberAffected = Users.update(selector, {
      $set: {
        loggedOut: true
      }
    });

    if (numberAffected) {
      Logger.info("user left id=".concat(requesterUserId, " meeting=").concat(meetingId));
      ClientConnections.removeClientConnection(this.userId, this.connection.id);
    }
  } catch (err) {
    Logger.error("Error on user left: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateAuthToken.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods/validateAuthToken.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => validateAuthToken
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let upsertValidationState;
module.link("/imports/api/auth-token-validation/server/modifiers/upsertValidationState", {
  default(v) {
    upsertValidationState = v;
  }

}, 3);
let ValidationStates;
module.link("/imports/api/auth-token-validation", {
  ValidationStates(v) {
    ValidationStates = v;
  }

}, 4);
let pendingAuthenticationsStore;
module.link("../store/pendingAuthentications", {
  default(v) {
    pendingAuthenticationsStore = v;
  }

}, 5);
let BannedUsers;
module.link("../store/bannedUsers", {
  default(v) {
    BannedUsers = v;
  }

}, 6);

function validateAuthToken(meetingId, requesterUserId, requesterToken, externalId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ValidateAuthTokenReqMsg';
  Logger.debug('ValidateAuthToken method called', {
    meetingId,
    requesterUserId,
    requesterToken,
    externalId
  }); // Check if externalId is banned from the meeting

  if (externalId) {
    if (BannedUsers.has(meetingId, externalId)) {
      Logger.warn("A banned user with extId ".concat(externalId, " tried to enter in meeting ").concat(meetingId));
      return {
        invalid: true,
        reason: 'User has been banned',
        error_type: 'user_banned'
      };
    }
  }

  if (!meetingId) return false; // Store reference of methodInvocationObject ( to postpone the connection userId definition )

  pendingAuthenticationsStore.add(meetingId, requesterUserId, requesterToken, this);
  upsertValidationState(meetingId, requesterUserId, ValidationStates.VALIDATING, this.connection.id);
  const payload = {
    userId: requesterUserId,
    authToken: requesterToken
  };
  Logger.info("User '".concat(requesterUserId, "' is trying to validate auth token for meeting '").concat(meetingId, "' from connection '").concat(this.connection.id, "'"));
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addDialInUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/addDialInUser.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addDialInUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addUser;
module.link("/imports/api/users/server/modifiers/addUser", {
  default(v) {
    addUser = v;
  }

}, 1);

function addDialInUser(meetingId, voiceUser) {
  check(meetingId, String);
  check(voiceUser, Object);
  const USER_CONFIG = Meteor.settings.public.user;
  const ROLE_VIEWER = USER_CONFIG.role_viewer;
  const {
    intId,
    callerName
  } = voiceUser;
  const voiceOnlyUser = {
    intId,
    extId: intId,
    // TODO
    name: callerName,
    role: ROLE_VIEWER.toLowerCase(),
    guest: false,
    authed: true,
    waitingForAcceptance: false,
    guestStatus: 'ALLOW',
    emoji: 'none',
    presenter: false,
    locked: false,
    // TODO
    avatar: '',
    clientType: 'dial-in-user'
  };
  return addUser(meetingId, voiceOnlyUser);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/addUser.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 3);
let VoiceUsers;
module.link("/imports/api/voice-users/", {
  default(v) {
    VoiceUsers = v;
  }

}, 4);

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 5);
let SanitizeHTML;
module.link("sanitize-html", {
  default(v) {
    SanitizeHTML = v;
  }

}, 6);
let stringHash;
module.link("string-hash", {
  default(v) {
    stringHash = v;
  }

}, 7);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 8);
let addVoiceUser;
module.link("/imports/api/voice-users/server/modifiers/addVoiceUser", {
  default(v) {
    addVoiceUser = v;
  }

}, 9);
const COLOR_LIST = ['#7b1fa2', '#6a1b9a', '#4a148c', '#5e35b1', '#512da8', '#4527a0', '#311b92', '#3949ab', '#303f9f', '#283593', '#1a237e', '#1976d2', '#1565c0', '#0d47a1', '#0277bd', '#01579b'];

function addUser(meetingId, userData) {
  const user = userData;
  const sanitizedName = SanitizeHTML(userData.name, {
    allowedTags: [],
    allowedAttributes: {}
  }); // if user typed only tags

  user.name = sanitizedName.length === 0 ? _.escape(userData.name) : sanitizedName;
  check(meetingId, String);
  check(user, {
    intId: String,
    extId: String,
    name: String,
    role: String,
    guest: Boolean,
    authed: Boolean,
    waitingForAcceptance: Match.Maybe(Boolean),
    guestStatus: String,
    emoji: String,
    presenter: Boolean,
    locked: Boolean,
    avatar: String,
    clientType: String
  });
  const userId = user.intId;
  const selector = {
    meetingId,
    userId
  };
  const Meeting = Meetings.findOne({
    meetingId
  });
  /* While the akka-apps dont generate a color we just pick one
    from a list based on the userId */

  const color = COLOR_LIST[stringHash(user.intId) % COLOR_LIST.length];
  const modifier = {
    $set: Object.assign({
      meetingId,
      sortName: user.name.trim().toLowerCase(),
      color,
      mobile: false,
      breakoutProps: {
        isBreakoutUser: Meeting.meetingProp.isBreakout,
        parentId: Meeting.breakoutProps.parentId
      },
      effectiveConnectionType: null,
      inactivityCheck: false,
      responseDelay: 0,
      loggedOut: false
    }, flat(user))
  }; // Only add an empty VoiceUser if there isn't one already and if the user coming in isn't a
  // dial-in user. We want to avoid overwriting good data

  if (user.clientType !== 'dial-in-user' && !VoiceUsers.findOne({
    meetingId,
    intId: userId
  })) {
    addVoiceUser(meetingId, {
      voiceUserId: '',
      intId: userId,
      callerName: user.name,
      callerNum: '',
      muted: false,
      talking: false,
      callingWith: '',
      listenOnly: false,
      voiceConf: '',
      joined: false
    });
  }

  try {
    const {
      insertedId
    } = Users.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added user id=".concat(userId, " meeting=").concat(meetingId));
    } else {
      Logger.info("Upserted user id=".concat(userId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding user to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changePresenter.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/changePresenter.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changePresenter
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);
let stopWatchingExternalVideoSystemCall;
module.link("/imports/api/external-videos/server/methods/stopWatchingExternalVideoSystemCall", {
  default(v) {
    stopWatchingExternalVideoSystemCall = v;
  }

}, 3);

function changePresenter(presenter, userId, meetingId, changedBy) {
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      presenter
    }
  };

  try {
    const meeting = Meetings.findOne({
      meetingId
    });

    if (meeting && meeting.externalVideoUrl) {
      Logger.info("ChangePresenter:There is external video being shared. Stopping it due to presenter change, ".concat(meeting.externalVideoUrl));
      stopWatchingExternalVideoSystemCall({
        meetingId,
        requesterUserId: 'system-presenter-changed'
      });
    }

    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Changed presenter=".concat(presenter, " id=").concat(userId, " meeting=").concat(meetingId) + "".concat(changedBy ? " changedBy=".concat(changedBy) : ''));
    }
  } catch (err) {
    Logger.error("Changed user role: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeRole.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/changeRole.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeRole
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);

function changeRole(role, userId, meetingId, changedBy) {
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      role
    }
  };

  try {
    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Changed user role=".concat(role, " id=").concat(userId, " meeting=").concat(meetingId) + "".concat(changedBy ? " changedBy=".concat(changedBy) : ''));
    }
  } catch (err) {
    Logger.error("Changed user role: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/clearUsers.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearUsers
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Users;
module.link("/imports/api/users/index", {
  default(v) {
    Users = v;
  }

}, 1);

function clearUsers(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = Users.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared Users (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error clearing Users (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = Users.remove({});

      if (numberAffected) {
        Logger.info('Cleared Users (all)');
      }
    } catch (err) {
      Logger.error("Error clearing Users (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createDummyUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/createDummyUser.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => createDummyUser
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 3);

function createDummyUser(meetingId, userId, authToken) {
  check(meetingId, String);
  check(userId, String);
  check(authToken, String);
  const User = Users.findOne({
    meetingId,
    userId
  });

  if (User) {
    throw new Meteor.Error('existing-user', 'Tried to create a dummy user for an existing user');
  }

  const doc = {
    meetingId,
    userId,
    authToken,
    clientType: 'HTML5',
    validated: null
  };

  try {
    const insertedId = Users.insert(doc);

    if (insertedId) {
      Logger.info("Created dummy user id=".concat(userId, " token=").concat(authToken, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Creating dummy user to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/removeUser.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removeUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let VideoStreams;
module.link("/imports/api/video-streams", {
  default(v) {
    VideoStreams = v;
  }

}, 2);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 3);
let stopWatchingExternalVideoSystemCall;
module.link("/imports/api/external-videos/server/methods/stopWatchingExternalVideoSystemCall", {
  default(v) {
    stopWatchingExternalVideoSystemCall = v;
  }

}, 4);
let clearUserInfoForRequester;
module.link("/imports/api/users-infos/server/modifiers/clearUserInfoForRequester", {
  default(v) {
    clearUserInfoForRequester = v;
  }

}, 5);
let ClientConnections;
module.link("/imports/startup/server/ClientConnections", {
  default(v) {
    ClientConnections = v;
  }

}, 6);

const clearAllSessions = sessionUserId => {
  const serverSessions = Meteor.server.sessions;
  Object.keys(serverSessions).filter(i => serverSessions[i].userId === sessionUserId).forEach(i => serverSessions[i].close());
};

function removeUser(meetingId, userId) {
  check(meetingId, String);
  check(userId, String);
  const userToRemove = Users.findOne({
    userId,
    meetingId
  });

  if (userToRemove) {
    const {
      presenter
    } = userToRemove;

    if (presenter) {
      stopWatchingExternalVideoSystemCall({
        meetingId,
        requesterUserId: 'system-presenter-was-removed'
      });
    }
  }

  const selector = {
    meetingId,
    userId
  };

  try {
    VideoStreams.remove({
      meetingId,
      userId
    });
    const sessionUserId = "".concat(meetingId, "-").concat(userId);
    ClientConnections.removeClientConnection("".concat(meetingId, "--").concat(userId));
    clearAllSessions(sessionUserId);
    clearUserInfoForRequester(meetingId, userId);
    Users.remove(selector);
    Logger.info("Removed user id=".concat(userId, " meeting=").concat(meetingId));
  } catch (err) {
    Logger.error("Removing user from Users collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setMobile.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/setMobile.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setMobile
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);

function setMobile(meetingId, userId) {
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      mobile: true
    }
  };

  try {
    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Assigned mobile user id=".concat(userId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Assigning mobile user: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setUserEffectiveConnectionType.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/setUserEffectiveConnectionType.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => setUserEffectiveConnectionType
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function setUserEffectiveConnectionType(meetingId, userId, effectiveConnectionType) {
  check(meetingId, String);
  check(userId, String);
  check(effectiveConnectionType, String);
  const selector = {
    meetingId,
    userId,
    effectiveConnectionType: {
      $ne: effectiveConnectionType
    }
  };
  const modifier = {
    $set: {
      effectiveConnectionType
    }
  };

  try {
    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Updated user ".concat(userId, " effective connection to ").concat(effectiveConnectionType, " in meeting ").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Updating user ".concat(userId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userEjected.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/userEjected.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userEjected
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);
let clearUserInfoForRequester;
module.link("/imports/api/users-infos/server/modifiers/clearUserInfoForRequester", {
  default(v) {
    clearUserInfoForRequester = v;
  }

}, 3);

function userEjected(meetingId, userId, ejectedReason) {
  check(meetingId, String);
  check(userId, String);
  check(ejectedReason, String);
  const selector = {
    meetingId,
    userId
  };
  const modifier = {
    $set: {
      ejected: true,
      ejectedReason
    }
  };

  try {
    const numberAffected = Users.update(selector, modifier);

    if (numberAffected) {
      clearUserInfoForRequester(meetingId, userId);
      Logger.info("Ejected user id=".concat(userId, " meeting=").concat(meetingId, " reason=").concat(ejectedReason));
    }
  } catch (err) {
    Logger.error("Ejecting user from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userInactivityInspect.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/modifiers/userInactivityInspect.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userInactivityInspect
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 2);

function userInactivityInspect(userId, responseDelay) {
  check(userId, String);
  check(responseDelay, Match.Integer);
  const selector = {
    userId,
    inactivityCheck: false
  };
  const modifier = {
    $set: {
      inactivityCheck: true,
      responseDelay
    }
  };

  try {
    const {
      numberAffected
    } = Users.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Updated user ".concat(userId, " with inactivity inspect"));
    }
  } catch (err) {
    Logger.error("Inactivity check for user ".concat(userId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"store":{"bannedUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/store/bannedUsers.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

class BannedUsers {
  constructor() {
    Logger.debug('BannedUsers :: Initializing');
    this.store = new Mongo.Collection('users-banned');

    if (Meteor.isServer) {
      // types of queries for the users:
      // 1. meetingId
      // 2. meetingId, userId
      this.store._ensureIndex({
        meetingId: 1,
        userId: 1
      });
    }
  }

  init(meetingId) {
    Logger.debug('BannedUsers :: init', {
      meetingId
    }); // if (!this.store[meetingId]) this.store[meetingId] = new Set();
  }

  add(meetingId, externalId) {
    check(meetingId, String);
    check(externalId, String);
    Logger.debug('BannedUsers :: add', {
      meetingId,
      externalId
    });
    const selector = {
      meetingId,
      externalId
    };
    const modifier = Object.assign( // TODO
    {
      meetingId
    }, {
      externalId
    });

    try {
      const insertedId = this.store.upsert(selector, modifier);

      if (insertedId) {
        Logger.info('BannedUsers :: Added to BannedUsers collection', {
          meetingId,
          externalId
        });
      }
    } catch (err) {
      Logger.error('BannedUsers :: Error on adding to BannedUsers collection', {
        meetingId,
        externalId,
        err
      });
    }
  }

  delete(meetingId) {
    check(meetingId, String);
    const selector = {
      meetingId
    };

    try {
      this.store.remove(selector);
      Logger.info('BannedUsers :: Removed meeting', {
        meetingId
      });
    } catch (err) {
      Logger.error('BannedUsers :: Removing from collection', {
        err
      });
    }
  }

  has(meetingId, externalId) {
    check(meetingId, String);
    check(externalId, String);
    Logger.info('BannedUsers :: has', {
      meetingId,
      externalId
    });
    return this.store.findOne({
      meetingId,
      externalId
    });
  }

}

module.exportDefault(new BannedUsers());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pendingAuthentications.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/store/pendingAuthentications.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);

class PendingAuthentitcations {
  constructor() {
    Logger.debug('PendingAuthentitcations :: constructor');
    this.store = [];
  }

  generateKey(meetingId, userId, authToken) {
    // Protect against separator injection
    meetingId = meetingId.replace(/ /g, '');
    userId = userId.replace(/ /g, '');
    authToken = authToken.replace(/ /g, ''); // Space separated key

    return "".concat(meetingId, " ").concat(userId, " ").concat(authToken);
  }

  add(meetingId, userId, authToken, methodInvocationObject) {
    Logger.debug('PendingAuthentitcations :: add', {
      meetingId,
      userId,
      authToken
    });
    this.store.push({
      key: this.generateKey(meetingId, userId, authToken),
      meetingId,
      userId,
      authToken,
      methodInvocationObject
    });
  }

  take(meetingId, userId, authToken) {
    const key = this.generateKey(meetingId, userId, authToken);
    Logger.debug('PendingAuthentitcations :: take', {
      key,
      meetingId,
      userId,
      authToken
    }); // find matches

    const matches = this.store.filter(e => e.key === key); // remove matches (if any)

    if (matches.length) {
      this.store = this.store.filter(e => e.key !== key);
    } // return matches


    return matches;
  }

}

module.exportDefault(new PendingAuthentitcations());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/eventHandlers.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleRemoveUser;
module.link("./handlers/removeUser", {
  default(v) {
    handleRemoveUser = v;
  }

}, 1);
let handleUserJoined;
module.link("./handlers/userJoined", {
  default(v) {
    handleUserJoined = v;
  }

}, 2);
let handleValidateAuthToken;
module.link("./handlers/validateAuthToken", {
  default(v) {
    handleValidateAuthToken = v;
  }

}, 3);
let handlePresenterAssigned;
module.link("./handlers/presenterAssigned", {
  default(v) {
    handlePresenterAssigned = v;
  }

}, 4);
let handleEmojiStatus;
module.link("./handlers/emojiStatus", {
  default(v) {
    handleEmojiStatus = v;
  }

}, 5);
let handleUserEjected;
module.link("./handlers/userEjected", {
  default(v) {
    handleUserEjected = v;
  }

}, 6);
let handleChangeRole;
module.link("./handlers/changeRole", {
  default(v) {
    handleChangeRole = v;
  }

}, 7);
let handleUserInactivityInspect;
module.link("./handlers/userInactivityInspect", {
  default(v) {
    handleUserInactivityInspect = v;
  }

}, 8);
RedisPubSub.on('PresenterAssignedEvtMsg', handlePresenterAssigned);
RedisPubSub.on('UserJoinedMeetingEvtMsg', handleUserJoined);
RedisPubSub.on('UserLeftMeetingEvtMsg', handleRemoveUser);
RedisPubSub.on('ValidateAuthTokenRespMsg', handleValidateAuthToken);
RedisPubSub.on('UserEmojiChangedEvtMsg', handleEmojiStatus); // RedisPubSub.on('SyncGetUsersMeetingRespMsg', handleGetUsers);

RedisPubSub.on('UserEjectedFromMeetingEvtMsg', handleUserEjected);
RedisPubSub.on('UserRoleChangedEvtMsg', handleChangeRole);
RedisPubSub.on('UserInactivityInspectMsg', handleUserInactivityInspect);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/index.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/methods.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let validateAuthToken;
module.link("./methods/validateAuthToken", {
  default(v) {
    validateAuthToken = v;
  }

}, 1);
let setEmojiStatus;
module.link("./methods/setEmojiStatus", {
  default(v) {
    setEmojiStatus = v;
  }

}, 2);
let setMobileUser;
module.link("./methods/setMobileUser", {
  default(v) {
    setMobileUser = v;
  }

}, 3);
let assignPresenter;
module.link("./methods/assignPresenter", {
  default(v) {
    assignPresenter = v;
  }

}, 4);
let changeRole;
module.link("./methods/changeRole", {
  default(v) {
    changeRole = v;
  }

}, 5);
let removeUser;
module.link("./methods/removeUser", {
  default(v) {
    removeUser = v;
  }

}, 6);
let toggleUserLock;
module.link("./methods/toggleUserLock", {
  default(v) {
    toggleUserLock = v;
  }

}, 7);
let setUserEffectiveConnectionType;
module.link("./methods/setUserEffectiveConnectionType", {
  default(v) {
    setUserEffectiveConnectionType = v;
  }

}, 8);
let userActivitySign;
module.link("./methods/userActivitySign", {
  default(v) {
    userActivitySign = v;
  }

}, 9);
let userLeftMeeting;
module.link("./methods/userLeftMeeting", {
  default(v) {
    userLeftMeeting = v;
  }

}, 10);
let setRandomUser;
module.link("./methods/setRandomUser", {
  default(v) {
    setRandomUser = v;
  }

}, 11);
Meteor.methods({
  setEmojiStatus,
  setMobileUser,
  assignPresenter,
  changeRole,
  removeUser,
  validateAuthToken,
  toggleUserLock,
  setUserEffectiveConnectionType,
  userActivitySign,
  userLeftMeeting,
  setRandomUser
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/server/publishers.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);
const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

function currentUser() {
  if (!this.userId) {
    return Users.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(meetingId, String);
  check(requesterUserId, String);
  const selector = {
    meetingId,
    userId: requesterUserId,
    intId: {
      $exists: true
    }
  };
  const options = {
    fields: {
      user: false,
      authToken: false // Not asking for authToken from client side but also not exposing it

    }
  };
  return Users.find(selector, options);
}

function publishCurrentUser() {
  const boundUsers = currentUser.bind(this);
  return boundUsers(...arguments);
}

Meteor.publish('current-user', publishCurrentUser);

function users(role) {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing Users was requested by unauth connection ".concat(this.connection.id));
    return Users.find({
      meetingId: ''
    });
  }

  if (!this.userId) {
    return Users.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug("Publishing Users for ".concat(meetingId, " ").concat(userId));
  const selector = {
    $or: [{
      meetingId
    }],
    intId: {
      $exists: true
    }
  };
  const User = Users.findOne({
    userId,
    meetingId
  }, {
    fields: {
      role: 1
    }
  });

  if (!!User && User.role === ROLE_MODERATOR) {
    selector.$or.push({
      'breakoutProps.isBreakoutUser': true,
      'breakoutProps.parentId': meetingId
    });
  }

  const options = {
    fields: {
      authToken: false
    }
  };
  Logger.debug('Publishing Users', {
    meetingId,
    userId
  });
  return Users.find(selector, options);
}

function publish() {
  const boundUsers = users.bind(this);
  return boundUsers(...arguments);
}

Meteor.publish('users', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users/index.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const Users = new Mongo.Collection('users');

if (Meteor.isServer) {
  // types of queries for the users:
  // 1. meetingId
  // 2. meetingId, userId
  Users._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

module.exportDefault(Users);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users-infos":{"server":{"handlers":{"userInformation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/handlers/userInformation.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUserInformation
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addUserInfo;
module.link("../modifiers/addUserInfo", {
  default(v) {
    addUserInfo = v;
  }

}, 1);

function handleUserInformation(_ref) {
  let {
    header,
    body
  } = _ref;
  check(body, Object);
  check(header, Object);
  const {
    userInfo
  } = body;
  const {
    userId,
    meetingId
  } = header;
  check(userInfo, Array);
  check(userId, String);
  check(meetingId, String);
  return addUserInfo(userInfo, userId, meetingId);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"removeUserInformation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/methods/removeUserInformation.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removeUserInformation
});
let UserInfos;
module.link("/imports/api/users-infos", {
  default(v) {
    UserInfos = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);

function removeUserInformation() {
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const selector = {
    meetingId,
    requesterUserId
  };

  try {
    const numberAffected = UserInfos.remove(selector);

    if (numberAffected) {
      Logger.info("Removed user information: requester id=".concat(requesterUserId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Removing user information from collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requestUserInformation.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/methods/requestUserInformation.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => getUserInformation
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function getUserInformation(externalUserId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toThirdParty;
  const EVENT_NAME = 'LookUpUserReqMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(externalUserId, String);
  const payload = {
    externalUserId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addUserInfo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/modifiers/addUserInfo.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addUserInfo
});
let UserInfos;
module.link("/imports/api/users-infos", {
  default(v) {
    UserInfos = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function addUserInfo(userInfo, requesterUserId, meetingId) {
  const info = {
    meetingId,
    requesterUserId,
    userInfo
  };

  try {
    const numberAffected = UserInfos.insert(info);

    if (numberAffected) {
      Logger.info("Added user information: requester id=".concat(requesterUserId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Adding user information to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearUserInfo.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/modifiers/clearUserInfo.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearUsersInfo
});
let UserInfos;
module.link("/imports/api/users-infos", {
  default(v) {
    UserInfos = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearUsersInfo(meetingId) {
  try {
    const numberAffected = UserInfos.remove({
      meetingId
    });

    if (numberAffected) {
      Logger.info("Cleared User Infos (".concat(meetingId, ")"));
    }
  } catch (err) {
    Logger.error("Error on clearing User Infos (".concat(meetingId, "). ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearUserInfoForRequester.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/modifiers/clearUserInfoForRequester.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearUsersInfoForRequester
});
let UserInfos;
module.link("/imports/api/users-infos", {
  default(v) {
    UserInfos = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearUsersInfoForRequester(meetingId, requesterUserId) {
  try {
    const numberAffected = UserInfos.remove({
      meetingId
    });

    if (numberAffected) {
      Logger.info("Cleared User Infos requested by user=".concat(requesterUserId));
    }
  } catch (err) {
    Logger.info("Error on clearing User Infos requested by user=".concat(requesterUserId, ". ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/eventHandlers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleUserInformation;
module.link("./handlers/userInformation", {
  default(v) {
    handleUserInformation = v;
  }

}, 1);
RedisPubSub.on('LookUpUserRespMsg', handleUserInformation);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/index.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/methods.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let requestUserInformation;
module.link("./methods/requestUserInformation", {
  default(v) {
    requestUserInformation = v;
  }

}, 1);
let removeUserInformation;
module.link("./methods/removeUserInformation", {
  default(v) {
    removeUserInformation = v;
  }

}, 2);
Meteor.methods({
  requestUserInformation,
  removeUserInformation
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/server/publishers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let UserInfos;
module.link("/imports/api/users-infos", {
  default(v) {
    UserInfos = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function userInfos() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing UserInfos was requested by unauth connection ".concat(this.connection.id));
    return UserInfos.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId: requesterUserId
  } = tokenValidation;
  Logger.debug('Publishing UserInfos requested', {
    meetingId,
    requesterUserId
  });
  return UserInfos.find({
    meetingId,
    requesterUserId
  });
}

function publish() {
  const boundUserInfos = userInfos.bind(this);
  return boundUserInfos(...arguments);
}

Meteor.publish('users-infos', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-infos/index.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const UserInfos = new Mongo.Collection('users-infos');

if (Meteor.isServer) {
  UserInfos._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

module.exportDefault(UserInfos);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users-settings":{"server":{"methods":{"addUserSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/server/methods/addUserSettings.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  default: () => addUserSettings
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let addUserSetting;
module.link("/imports/api/users-settings/server/modifiers/addUserSetting", {
  default(v) {
    addUserSetting = v;
  }

}, 1);
let logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    logger = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);
const oldParameters = {
  askForFeedbackOnLogout: 'bbb_ask_for_feedback_on_logout',
  autoJoin: 'bbb_auto_join_audio',
  autoShareWebcam: 'bbb_auto_share_webcam',
  autoSwapLayout: 'bbb_auto_swap_layout',
  clientTitle: 'bbb_client_title',
  customStyle: 'bbb_custom_style',
  customStyleUrl: 'bbb_custom_style_url',
  displayBrandingArea: 'bbb_display_branding_area',
  enableScreensharing: 'bbb_enable_screen_sharing',
  enableVideo: 'bbb_enable_video',
  forceListenOnly: 'bbb_force_listen_only',
  hidePresentation: 'bbb_hide_presentation',
  listenOnlyMode: 'bbb_listen_only_mode',
  multiUserPenOnly: 'bbb_multi_user_pen_only',
  multiUserTools: 'bbb_multi_user_tools',
  outsideToggleRecording: 'bbb_outside_toggle_recording',
  outsideToggleSelfVoice: 'bbb_outside_toggle_self_voice',
  presenterTools: 'bbb_presenter_tools',
  shortcuts: 'bbb_shortcuts',
  skipCheck: 'bbb_skip_check_audio'
};
const oldParametersKeys = Object.keys(oldParameters);
const currentParameters = [// APP
'bbb_ask_for_feedback_on_logout', 'bbb_override_default_locale', 'bbb_auto_join_audio', 'bbb_client_title', 'bbb_force_listen_only', 'bbb_listen_only_mode', 'bbb_skip_check_audio', 'bbb_skip_check_audio_on_first_join', // BRANDING
'bbb_display_branding_area', // SHORTCUTS
'bbb_shortcuts', // KURENTO
'bbb_auto_share_webcam', 'bbb_preferred_camera_profile', 'bbb_enable_screen_sharing', 'bbb_enable_video', 'bbb_record_video', 'bbb_skip_video_preview', 'bbb_skip_video_preview_on_first_join', 'bbb_mirror_own_webcam', // PRESENTATION
'bbb_force_restore_presentation_on_new_events', // WHITEBOARD
'bbb_multi_user_pen_only', 'bbb_presenter_tools', 'bbb_multi_user_tools', // SKINNING/THEMMING
'bbb_custom_style', 'bbb_custom_style_url', // LAYOUT
'bbb_auto_swap_layout', 'bbb_hide_presentation', 'bbb_show_participants_on_login', 'bbb_show_public_chat_on_login', // OUTSIDE COMMANDS
'bbb_outside_toggle_self_voice', 'bbb_outside_toggle_recording'];

function valueParser(val) {
  try {
    const parsedValue = JSON.parse(val.toLowerCase().trim());
    return parsedValue;
  } catch (error) {
    logger.warn("addUserSettings:Parameter ".concat(val, " could not be parsed (was not json)"));
    return val;
  }
}

function addUserSettings(settings) {
  check(settings, [Object]);
  const {
    meetingId,
    requesterUserId: userId
  } = extractCredentials(this.userId);
  let parameters = {};
  settings.forEach(el => {
    const settingKey = Object.keys(el).shift();
    const normalizedKey = settingKey.trim();

    if (currentParameters.includes(normalizedKey)) {
      if (!Object.keys(parameters).includes(normalizedKey)) {
        parameters = _objectSpread({
          [normalizedKey]: valueParser(el[settingKey])
        }, parameters);
      } else {
        parameters[normalizedKey] = el[settingKey];
      }

      return;
    }

    if (oldParametersKeys.includes(normalizedKey)) {
      const matchingNewKey = oldParameters[normalizedKey];

      if (!Object.keys(parameters).includes(matchingNewKey)) {
        parameters = _objectSpread({
          [matchingNewKey]: valueParser(el[settingKey])
        }, parameters);
      }

      return;
    }

    logger.warn("Parameter ".concat(normalizedKey, " not handled"));
  });
  const settingsAdded = [];
  Object.entries(parameters).forEach(el => {
    const setting = el[0];
    const value = el[1];
    settingsAdded.push(addUserSetting(meetingId, userId, setting, value));
  });
  return settingsAdded;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addUserSetting.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/server/modifiers/addUserSetting.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addUserSetting
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let UserSettings;
module.link("/imports/api/users-settings", {
  default(v) {
    UserSettings = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function addUserSetting(meetingId, userId, setting, value) {
  check(meetingId, String);
  check(userId, String);
  check(setting, String);
  check(value, Match.Any);
  const selector = {
    meetingId,
    userId,
    setting
  };
  const modifier = {
    $set: {
      meetingId,
      userId,
      setting,
      value
    }
  };

  try {
    const {
      numberAffected
    } = UserSettings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.verbose('Upserted user setting', {
        meetingId,
        userId,
        setting
      });
    }
  } catch (err) {
    Logger.error("Adding user setting to collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearUsersSettings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/server/modifiers/clearUsersSettings.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearUsersSettings
});
let UserSettings;
module.link("/imports/api/users-settings", {
  default(v) {
    UserSettings = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);

function clearUsersSettings(meetingId) {
  try {
    const numberAffected = UserSettings.remove({
      meetingId
    });

    if (numberAffected) {
      Logger.info("Cleared User Settings (".concat(meetingId, ")"));
    }
  } catch (err) {
    Logger.error("Error on clearing User Settings (".concat(meetingId, "). ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/server/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/server/methods.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let addUserSettings;
module.link("./methods/addUserSettings", {
  default(v) {
    addUserSettings = v;
  }

}, 1);
Meteor.methods({
  addUserSettings
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/server/publishers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let UserSettings;
module.link("/imports/api/users-settings", {
  default(v) {
    UserSettings = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);
let User;
module.link("/imports/api/users", {
  default(v) {
    User = v;
  }

}, 4);

function userSettings() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing UserSettings was requested by unauth connection ".concat(this.connection.id));
    return UserSettings.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  const currentUser = User.findOne({
    userId
  });

  if (currentUser && currentUser.breakoutProps.isBreakoutUser) {
    const {
      parentId
    } = currentUser.breakoutProps;
    const [externalId] = currentUser.extId.split('-');
    const mainRoomUserSettings = UserSettings.find({
      meetingId: parentId,
      userId: externalId
    });
    mainRoomUserSettings.map((_ref) => {
      let {
        setting,
        value
      } = _ref;
      return {
        meetingId,
        setting,
        userId,
        value
      };
    }).forEach(doc => {
      const selector = {
        meetingId,
        setting: doc.setting
      };
      UserSettings.upsert(selector, doc);
    });
    Logger.debug('Publishing UserSettings', {
      meetingId,
      userId
    });
    return UserSettings.find({
      meetingId,
      userId
    });
  }

  Logger.debug('Publishing UserSettings', {
    meetingId,
    userId
  });
  return UserSettings.find({
    meetingId,
    userId
  });
}

function publish() {
  const boundUserSettings = userSettings.bind(this);
  return boundUserSettings(...arguments);
}

Meteor.publish('users-settings', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/users-settings/index.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const UserSettings = new Mongo.Collection('users-settings');

if (Meteor.isServer) {
  UserSettings._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

module.exportDefault(UserSettings);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"video-streams":{"server":{"handlers":{"userSharedHtml5Webcam.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/handlers/userSharedHtml5Webcam.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUserSharedHtml5Webcam
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let sharedWebcam;
module.link("../modifiers/sharedWebcam", {
  default(v) {
    sharedWebcam = v;
  }

}, 1);
let isValidStream;
module.link("/imports/api/video-streams/server/helpers", {
  isValidStream(v) {
    isValidStream = v;
  }

}, 2);

function handleUserSharedHtml5Webcam(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId,
    stream
  } = body;
  check(header, Object);
  check(meetingId, String);
  check(userId, String);
  check(stream, String);
  if (!isValidStream(stream)) return false;
  return sharedWebcam(meetingId, userId, stream);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userUnsharedHtml5Webcam.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/handlers/userUnsharedHtml5Webcam.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleUserUnsharedHtml5Webcam
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let unsharedWebcam;
module.link("../modifiers/unsharedWebcam", {
  default(v) {
    unsharedWebcam = v;
  }

}, 1);
let isValidStream;
module.link("/imports/api/video-streams/server/helpers", {
  isValidStream(v) {
    isValidStream = v;
  }

}, 2);

function handleUserUnsharedHtml5Webcam(_ref, meetingId) {
  let {
    header,
    body
  } = _ref;
  const {
    userId,
    stream
  } = body;
  check(header, Object);
  check(meetingId, String);
  check(userId, String);
  check(stream, String);
  if (!isValidStream(stream)) return false;
  return unsharedWebcam(meetingId, userId, stream);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"userShareWebcam.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/methods/userShareWebcam.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userShareWebcam
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function userShareWebcam(stream) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserBroadcastCamStartMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  Logger.info("user sharing webcam: ".concat(meetingId, " ").concat(requesterUserId));
  check(stream, String); // const actionName = 'joinVideo';

  /* TODO throw an error if user has no permission to share webcam
  if (!isAllowedTo(actionName, credentials)) {
    throw new Meteor.Error('not-allowed', `You are not allowed to share webcam`);
  } */

  const payload = {
    stream
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userUnshareWebcam.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/methods/userUnshareWebcam.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => userUnshareWebcam
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 3);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 4);

function userUnshareWebcam(stream) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserBroadcastCamStopMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  Logger.info("user unsharing webcam: ".concat(meetingId, " ").concat(requesterUserId));
  check(stream, String); // const actionName = 'joinVideo';

  /* TODO throw an error if user has no permission to share webcam
  if (!isAllowedTo(actionName, credentials)) {
    throw new Meteor.Error('not-allowed', `You are not allowed to share webcam`);
  } */

  const payload = {
    stream
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearVideoStreams.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/modifiers/clearVideoStreams.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearVideoStreams
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let VideoStreams;
module.link("/imports/api/video-streams", {
  default(v) {
    VideoStreams = v;
  }

}, 1);

function clearVideoStreams(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = VideoStreams.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared VideoStreams in (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing VideoStreams (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = VideoStreams.remove({});

      if (numberAffected) {
        Logger.info('Cleared VideoStreams in all meetings');
      }
    } catch (err) {
      Logger.error("Error on clearing VideoStreams (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sharedWebcam.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/modifiers/sharedWebcam.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => sharedWebcam
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let VideoStreams;
module.link("/imports/api/video-streams", {
  default(v) {
    VideoStreams = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let getDeviceId, getUserName;
module.link("/imports/api/video-streams/server/helpers", {
  getDeviceId(v) {
    getDeviceId = v;
  },

  getUserName(v) {
    getUserName = v;
  }

}, 3);

function sharedWebcam(meetingId, userId, stream) {
  check(meetingId, String);
  check(userId, String);
  check(stream, String);
  const deviceId = getDeviceId(stream);
  const name = getUserName(userId);
  const selector = {
    meetingId,
    userId,
    deviceId
  };
  const modifier = {
    $set: {
      stream,
      name
    }
  };

  try {
    const {
      insertedId
    } = VideoStreams.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Updated stream=".concat(stream, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Error setting stream: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unsharedWebcam.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/modifiers/unsharedWebcam.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => unsharedWebcam
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let VideoStreams;
module.link("/imports/api/video-streams", {
  default(v) {
    VideoStreams = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let getDeviceId;
module.link("/imports/api/video-streams/server/helpers", {
  getDeviceId(v) {
    getDeviceId = v;
  }

}, 3);

function unsharedWebcam(meetingId, userId, stream) {
  check(meetingId, String);
  check(userId, String);
  check(stream, String);
  const deviceId = getDeviceId(stream);
  const selector = {
    meetingId,
    userId,
    deviceId
  };

  try {
    VideoStreams.remove(selector);
    Logger.info("Removed stream=".concat(stream, " meeting=").concat(meetingId));
  } catch (err) {
    Logger.error("Error removing stream: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/eventHandlers.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleUserSharedHtml5Webcam;
module.link("./handlers/userSharedHtml5Webcam", {
  default(v) {
    handleUserSharedHtml5Webcam = v;
  }

}, 1);
let handleUserUnsharedHtml5Webcam;
module.link("./handlers/userUnsharedHtml5Webcam", {
  default(v) {
    handleUserUnsharedHtml5Webcam = v;
  }

}, 2);
RedisPubSub.on('UserBroadcastCamStartedEvtMsg', handleUserSharedHtml5Webcam);
RedisPubSub.on('UserBroadcastCamStoppedEvtMsg', handleUserUnsharedHtml5Webcam);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/helpers.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  isValidStream: () => isValidStream,
  getDeviceId: () => getDeviceId,
  getUserName: () => getUserName
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
const FLASH_STREAM_REGEX = /^([A-z0-9]+)-([A-z0-9]+)-([A-z0-9]+)(-recorded)?$/;
const TOKEN = '_';

const isValidStream = stream => !FLASH_STREAM_REGEX.test(stream);

const getDeviceId = stream => {
  const splitStream = stream.split(TOKEN);
  if (splitStream.length === 3) return splitStream[2];
  Logger.warn("Could not get deviceId from stream=".concat(stream));
  return stream;
};

const getUserName = userId => {
  const user = Users.findOne({
    userId
  }, {
    fields: {
      name: 1
    }
  });
  if (user) return user.name;
  return userId;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/index.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publisher");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/methods.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let userShareWebcam;
module.link("./methods/userShareWebcam", {
  default(v) {
    userShareWebcam = v;
  }

}, 1);
let userUnshareWebcam;
module.link("./methods/userUnshareWebcam", {
  default(v) {
    userUnshareWebcam = v;
  }

}, 2);
Meteor.methods({
  userShareWebcam,
  userUnshareWebcam
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publisher.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/server/publisher.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let VideoStreams;
module.link("/imports/api/video-streams", {
  default(v) {
    VideoStreams = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function videoStreams() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing VideoStreams was requested by unauth connection ".concat(this.connection.id));
    return VideoStreams.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing VideoStreams', {
    meetingId,
    userId
  });
  const selector = {
    meetingId
  };
  return VideoStreams.find(selector);
}

function publish() {
  const boundVideoStreams = videoStreams.bind(this);
  return boundVideoStreams(...arguments);
}

Meteor.publish('video-streams', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/video-streams/index.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const VideoStreams = new Mongo.Collection('video-streams');

if (Meteor.isServer) {
  // types of queries for the video users:
  // 2. meetingId
  VideoStreams._ensureIndex({
    meetingId: 1
  });
}

module.exportDefault(VideoStreams);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"voice-call-states":{"server":{"handlers":{"voiceCallStateEvent.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-call-states/server/handlers/voiceCallStateEvent.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleVoiceCallStateEvent
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let VoiceCallState;
module.link("/imports/api/voice-call-states", {
  default(v) {
    VoiceCallState = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function handleVoiceCallStateEvent(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    voiceConf,
    clientSession,
    userId,
    callerName,
    callState
  } = body;
  check(meetingId, String);
  check(voiceConf, String);
  check(clientSession, String);
  check(userId, String);
  check(callerName, String);
  check(callState, String);
  const selector = {
    meetingId,
    userId,
    clientSession
  };
  const modifier = {
    $set: {
      meetingId,
      userId,
      voiceConf,
      clientSession,
      callState
    }
  };

  try {
    const {
      numberAffected
    } = VoiceCallState.upsert(selector, modifier);

    if (numberAffected) {
      Logger.debug('Update voice call', {
        state: userId,
        meetingId,
        clientSession,
        callState
      });
    }
  } catch (err) {
    Logger.error("Update voice call state=".concat(userId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearVoiceCallStates.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-call-states/server/modifiers/clearVoiceCallStates.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearVoiceCallStates
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let VoiceCallStates;
module.link("/imports/api/voice-call-states", {
  default(v) {
    VoiceCallStates = v;
  }

}, 1);

function clearVoiceCallStates(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = VoiceCallStates.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared VoiceCallStates in (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.info("Error on clearing VoiceCallStates in (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = VoiceCallStates.remove({});

      if (numberAffected) {
        Logger.info('Cleared VoiceCallStates in all meetings');
      }
    } catch (err) {
      Logger.error("Error on clearing VoiceCallStates in all meetings. ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-call-states/server/eventHandlers.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let handleVoiceCallStateEvent;
module.link("./handlers/voiceCallStateEvent", {
  default(v) {
    handleVoiceCallStateEvent = v;
  }

}, 1);
RedisPubSub.on('VoiceCallStateEvtMsg', handleVoiceCallStateEvent);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-call-states/server/index.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-call-states/server/publishers.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let VoiceCallStates;
module.link("/imports/api/voice-call-states", {
  default(v) {
    VoiceCallStates = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function voiceCallStates() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing VoiceCallStates was requested by unauth connection ".concat(this.connection.id));
    return VoiceCallStates.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing Voice Call States', {
    meetingId,
    userId
  });
  return VoiceCallStates.find({
    meetingId,
    userId
  });
}

function publish() {
  const boundVoiceCallStates = voiceCallStates.bind(this);
  return boundVoiceCallStates(...arguments);
}

Meteor.publish('voice-call-states', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-call-states/index.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const VoiceCallStates = new Mongo.Collection('voiceCallStates');

if (Meteor.isServer) {
  // types of queries for the voice users:
  // 1. intId
  // 2. meetingId, intId
  VoiceCallStates._ensureIndex({
    meetingId: 1,
    userId: 1
  });
}

module.exportDefault(VoiceCallStates);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"voice-users":{"server":{"handlers":{"getVoiceUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/getVoiceUsers.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleGetVoiceUsers
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let VoiceUsers;
module.link("/imports/api/voice-users/", {
  default(v) {
    VoiceUsers = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);
let addVoiceUser;
module.link("../modifiers/addVoiceUser", {
  default(v) {
    addVoiceUser = v;
  }

}, 3);
let removeVoiceUser;
module.link("../modifiers/removeVoiceUser", {
  default(v) {
    removeVoiceUser = v;
  }

}, 4);
let updateVoiceUser;
module.link("../modifiers/updateVoiceUser", {
  default(v) {
    updateVoiceUser = v;
  }

}, 5);

function handleGetVoiceUsers(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    users
  } = body;
  check(meetingId, String);
  check(users, Array);
  const meeting = Meetings.findOne({
    meetingId
  }, {
    fields: {
      'voiceProp.voiceConf': 1
    }
  });
  const usersIds = users.map(m => m.intId);
  const voiceUsersIdsToUpdate = VoiceUsers.find({
    meetingId,
    intId: {
      $in: usersIds
    }
  }, {
    fields: {
      intId: 1
    }
  }).fetch().map(m => m.intId);
  const voiceUsersUpdated = [];
  users.forEach(user => {
    if (voiceUsersIdsToUpdate.indexOf(user.intId) >= 0) {
      // user already exist, then update
      voiceUsersUpdated.push(updateVoiceUser(meetingId, {
        intId: user.intId,
        voiceUserId: user.voiceUserId,
        talking: user.talking,
        muted: user.muted,
        voiceConf: meeting.voiceProp.voiceConf,
        joined: true
      }));
    } else {
      // user doesn't exist yet, then add it
      addVoiceUser(meetingId, {
        voiceUserId: user.voiceUserId,
        intId: user.intId,
        callerName: user.callerName,
        callerNum: user.callerNum,
        muted: user.muted,
        talking: user.talking,
        callingWith: user.callingWith,
        listenOnly: user.listenOnly,
        voiceConf: meeting.voiceProp.voiceConf,
        joined: true
      });
    }
  }); // removing extra users already existing in Mongo

  const voiceUsersToRemove = VoiceUsers.find({
    meetingId,
    intId: {
      $nin: usersIds
    }
  }).fetch();
  voiceUsersToRemove.forEach(user => removeVoiceUser(meetingId, {
    voiceConf: meeting.voiceProp.voiceConf,
    voiceUserId: user.voiceUserId,
    intId: user.intId
  }));
  return voiceUsersUpdated;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"joinVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/joinVoiceUser.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleJoinVoiceUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
let addDialInUser;
module.link("/imports/api/users/server/modifiers/addDialInUser", {
  default(v) {
    addDialInUser = v;
  }

}, 2);
let addVoiceUser;
module.link("../modifiers/addVoiceUser", {
  default(v) {
    addVoiceUser = v;
  }

}, 3);

function handleJoinVoiceUser(_ref, meetingId) {
  let {
    body
  } = _ref;
  const voiceUser = body;
  voiceUser.joined = true;
  check(meetingId, String);
  check(voiceUser, {
    voiceConf: String,
    intId: String,
    voiceUserId: String,
    callerName: String,
    callerNum: String,
    muted: Boolean,
    talking: Boolean,
    callingWith: String,
    listenOnly: Boolean,
    joined: Boolean
  });
  const {
    intId
  } = voiceUser;
  const User = Users.findOne({
    meetingId,
    intId
  });

  if (!User) {
    /* voice-only user - called into the conference */
    addDialInUser(meetingId, voiceUser);
  }

  return addVoiceUser(meetingId, voiceUser);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leftVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/leftVoiceUser.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleVoiceUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let removeVoiceUser;
module.link("/imports/api/voice-users/server/modifiers/removeVoiceUser", {
  default(v) {
    removeVoiceUser = v;
  }

}, 1);
let removeUser;
module.link("/imports/api/users/server/modifiers/removeUser", {
  default(v) {
    removeUser = v;
  }

}, 2);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 3);

function handleVoiceUpdate(_ref, meetingId) {
  let {
    body
  } = _ref;
  const voiceUser = body;
  check(meetingId, String);
  check(voiceUser, {
    voiceConf: String,
    intId: String,
    voiceUserId: String
  });
  const {
    intId,
    voiceUserId
  } = voiceUser;

  const isDialInUser = (userId, meetingID) => !!Users.findOne({
    meetingId: meetingID,
    userId,
    clientType: 'dial-in-user'
  }); // if the user is dial-in, leaving voice also means leaving userlist


  if (isDialInUser(voiceUserId, meetingId)) removeUser(meetingId, intId);
  return removeVoiceUser(meetingId, voiceUser);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"meetingMuted.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/meetingMuted.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleMeetingMuted
});
let changeMuteMeeting;
module.link("../modifiers/changeMuteMeeting", {
  default(v) {
    changeMuteMeeting = v;
  }

}, 0);

function handleMeetingMuted(_ref, meetingId) {
  let {
    body
  } = _ref;
  changeMuteMeeting(meetingId, body);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mutedVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/mutedVoiceUser.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleVoiceUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let updateVoiceUser;
module.link("../modifiers/updateVoiceUser", {
  default(v) {
    updateVoiceUser = v;
  }

}, 1);

function handleVoiceUpdate(_ref, meetingId) {
  let {
    body
  } = _ref;
  const voiceUser = body;
  check(meetingId, String); // If a person is muted we have to force them to not talking

  if (voiceUser.muted) {
    voiceUser.talking = false;
  }

  return updateVoiceUser(meetingId, voiceUser);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"talkingVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/talkingVoiceUser.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleVoiceUpdate
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let updateVoiceUser;
module.link("../modifiers/updateVoiceUser", {
  default(v) {
    updateVoiceUser = v;
  }

}, 1);

function handleVoiceUpdate(_ref, meetingId) {
  let {
    body
  } = _ref;
  const voiceUser = body;
  check(meetingId, String);
  return updateVoiceUser(meetingId, voiceUser);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"voiceUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/handlers/voiceUsers.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleVoiceUsers
});
let VoiceUsers;
module.link("/imports/api/voice-users/", {
  default(v) {
    VoiceUsers = v;
  }

}, 0);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 1);
let addDialInUser;
module.link("/imports/api/users/server/modifiers/addDialInUser", {
  default(v) {
    addDialInUser = v;
  }

}, 2);
let removeVoiceUser;
module.link("../modifiers/removeVoiceUser", {
  default(v) {
    removeVoiceUser = v;
  }

}, 3);
let updateVoiceUser;
module.link("../modifiers/updateVoiceUser", {
  default(v) {
    updateVoiceUser = v;
  }

}, 4);
let addVoiceUser;
module.link("../modifiers/addVoiceUser", {
  default(v) {
    addVoiceUser = v;
  }

}, 5);

function handleVoiceUsers(_ref) {
  let {
    header,
    body
  } = _ref;
  const {
    voiceUsers
  } = body;
  const {
    meetingId
  } = header;
  const meeting = Meetings.findOne({
    meetingId
  }, {
    fields: {
      'voiceProp.voiceConf': 1
    }
  });
  const usersIds = voiceUsers.map(m => m.intId);
  const voiceUsersIdsToUpdate = VoiceUsers.find({
    meetingId,
    intId: {
      $in: usersIds
    }
  }, {
    fields: {
      intId: 1
    }
  }).fetch().map(m => m.intId);
  const voiceUsersUpdated = [];
  voiceUsers.forEach(voice => {
    if (voiceUsersIdsToUpdate.indexOf(voice.intId) >= 0) {
      // user already exist, then update
      voiceUsersUpdated.push(updateVoiceUser(meetingId, {
        intId: voice.intId,
        voiceUserId: voice.voiceUserId,
        talking: voice.talking,
        muted: voice.muted,
        voiceConf: meeting.voiceProp.voiceConf,
        joined: true
      }));
    } else {
      // user doesn't exist yet, then add it
      addVoiceUser(meetingId, {
        voiceUserId: voice.voiceUserId,
        intId: voice.intId,
        callerName: voice.callerName,
        callerNum: voice.callerNum,
        muted: voice.muted,
        talking: voice.talking,
        callingWith: voice.callingWith,
        listenOnly: voice.listenOnly,
        voiceConf: meeting.voiceProp.voiceConf,
        joined: true
      });
      addDialInUser(meetingId, voice);
    }
  }); // removing extra users already existing in Mongo

  const voiceUsersToRemove = VoiceUsers.find({
    meetingId,
    intId: {
      $nin: usersIds
    }
  }, {
    fields: {
      voiceUserId: 1,
      intId: 1
    }
  }).fetch();
  voiceUsersToRemove.forEach(user => removeVoiceUser(meetingId, {
    voiceConf: meeting.voiceProp.voiceConf,
    voiceUserId: user.voiceUserId,
    intId: user.intId
  }));
  return voiceUsersUpdated;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"ejectUserFromVoice.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/methods/ejectUserFromVoice.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => ejectUserFromVoice
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function ejectUserFromVoice(userId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'EjectUserFromVoiceCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(userId, String);
  const payload = {
    userId,
    ejectedBy: requesterUserId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"muteAllExceptPresenterToggle.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/methods/muteAllExceptPresenterToggle.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => muteAllExceptPresenterToggle
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function muteAllExceptPresenterToggle() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'MuteAllExceptPresentersCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const meeting = Meetings.findOne({
    meetingId
  });
  const toggleMeetingMuted = !meeting.voiceProp.muteOnStart;
  const payload = {
    mutedBy: requesterUserId,
    mute: toggleMeetingMuted
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"muteAllToggle.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/methods/muteAllToggle.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => muteAllToggle
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 1);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function muteAllToggle() {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'MuteMeetingCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const meeting = Meetings.findOne({
    meetingId
  });
  const toggleMeetingMuted = !meeting.voiceProp.muteOnStart;
  const payload = {
    mutedBy: requesterUserId,
    mute: toggleMeetingMuted
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"muteToggle.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/methods/muteToggle.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => muteToggle
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 1);
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 2);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 3);
let VoiceUsers;
module.link("/imports/api/voice-users", {
  default(v) {
    VoiceUsers = v;
  }

}, 4);
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 5);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 6);

function muteToggle(uId, toggle) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'MuteUserCmdMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  const userToMute = uId || requesterUserId;
  const requester = Users.findOne({
    meetingId,
    userId: requesterUserId
  });
  const voiceUser = VoiceUsers.findOne({
    intId: userToMute,
    meetingId
  });
  if (!requester || !voiceUser) return;
  const {
    listenOnly,
    muted
  } = voiceUser;
  if (listenOnly) return; // if allowModsToUnmuteUsers is false, users will be kicked out for attempting to unmute others

  if (requesterUserId !== userToMute && muted) {
    const meeting = Meetings.findOne({
      meetingId
    }, {
      fields: {
        'usersProp.allowModsToUnmuteUsers': 1
      }
    });

    if (meeting.usersProp && !meeting.usersProp.allowModsToUnmuteUsers) {
      Logger.warn("Attempted unmuting by another user meetingId:".concat(meetingId, " requester: ").concat(requesterUserId, " userId: ").concat(userToMute));
      return;
    }
  }

  let _muted;

  if (toggle === undefined || toggle === null) {
    _muted = !muted;
  } else {
    _muted = !!toggle;
  }

  const payload = {
    userId: userToMute,
    mutedBy: requesterUserId,
    mute: _muted
  };
  RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"addVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/modifiers/addVoiceUser.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => addVoiceUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let VoiceUsers;
module.link("/imports/api/voice-users", {
  default(v) {
    VoiceUsers = v;
  }

}, 2);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 3);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 4);

function addVoiceUser(meetingId, voiceUser) {
  check(meetingId, String);
  check(voiceUser, {
    voiceUserId: String,
    intId: String,
    callerName: String,
    callerNum: String,
    muted: Boolean,
    talking: Boolean,
    callingWith: String,
    listenOnly: Boolean,
    voiceConf: String,
    joined: Boolean // This is a HTML5 only param.

  });
  const {
    intId,
    talking
  } = voiceUser;
  const selector = {
    meetingId,
    intId
  };
  const modifier = {
    $set: Object.assign({
      meetingId,
      spoke: talking
    }, flat(voiceUser))
  };
  const user = Users.findOne({
    meetingId,
    userId: intId
  }, {
    fields: {
      color: 1
    }
  });
  if (user) modifier.$set.color = user.color;

  try {
    const {
      numberAffected
    } = VoiceUsers.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Add voice user=".concat(intId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Add voice user=".concat(intId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeMuteMeeting.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/modifiers/changeMuteMeeting.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeMuteMeeting
});
let Meetings;
module.link("/imports/api/meetings", {
  default(v) {
    Meetings = v;
  }

}, 0);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);

function changeMuteMeeting(meetingId, payload) {
  check(meetingId, String);
  check(payload, {
    muted: Boolean,
    mutedBy: String
  });
  const selector = {
    meetingId
  };
  const modifier = {
    $set: {
      'voiceProp.muteOnStart': payload.muted
    }
  };

  try {
    const {
      numberAffected
    } = Meetings.upsert(selector, modifier);

    if (numberAffected) {
      Logger.info("Changed meeting mute status meeting=".concat(meetingId));
    }
  } catch (err) {
    Logger.error("Changing meeting mute status meeting={".concat(meetingId, "} ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clearVoiceUsers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/modifiers/clearVoiceUsers.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearVoiceUser
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let VoiceUsers;
module.link("/imports/api/voice-users", {
  default(v) {
    VoiceUsers = v;
  }

}, 1);

function clearVoiceUser(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = VoiceUsers.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared VoiceUsers in (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.error("Error on clearing VoiceUsers in ".concat(meetingId, ". ").concat(err));
    }
  } else {
    try {
      const numberAffected = VoiceUsers.remove({});

      if (numberAffected) {
        Logger.info('Cleared VoiceUsers in all meetings');
      }
    } catch (err) {
      Logger.error("Error on clearing VoiceUsers. ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/modifiers/removeVoiceUser.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => removeVoiceUser
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let VoiceUsers;
module.link("/imports/api/voice-users", {
  default(v) {
    VoiceUsers = v;
  }

}, 2);
let clearSpokeTimeout;
module.link("/imports/api/common/server/helpers", {
  clearSpokeTimeout(v) {
    clearSpokeTimeout = v;
  }

}, 3);

function removeVoiceUser(meetingId, voiceUser) {
  check(meetingId, String);
  check(voiceUser, {
    voiceConf: String,
    voiceUserId: String,
    intId: String
  });
  const {
    intId
  } = voiceUser;
  const selector = {
    meetingId,
    intId
  };
  const modifier = {
    $set: {
      muted: false,
      talking: false,
      listenOnly: false,
      joined: false,
      spoke: false
    }
  };

  try {
    clearSpokeTimeout(meetingId, intId);
    const numberAffected = VoiceUsers.update(selector, modifier);

    if (numberAffected) {
      Logger.info("Remove voiceUser=".concat(intId, " meeting=").concat(meetingId));
    }
  } catch (err) {
    Logger.error("Remove voiceUser=".concat(intId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateVoiceUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/modifiers/updateVoiceUser.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => updateVoiceUser
});
let Match, check;
module.link("meteor/check", {
  Match(v) {
    Match = v;
  },

  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let VoiceUsers;
module.link("/imports/api/voice-users", {
  default(v) {
    VoiceUsers = v;
  }

}, 2);
let flat;
module.link("flat", {
  default(v) {
    flat = v;
  }

}, 3);
let spokeTimeoutHandles, clearSpokeTimeout;
module.link("/imports/api/common/server/helpers", {
  spokeTimeoutHandles(v) {
    spokeTimeoutHandles = v;
  },

  clearSpokeTimeout(v) {
    clearSpokeTimeout = v;
  }

}, 4);
const TALKING_TIMEOUT = 6000;

function updateVoiceUser(meetingId, voiceUser) {
  check(meetingId, String);
  check(voiceUser, {
    intId: String,
    voiceUserId: String,
    talking: Match.Maybe(Boolean),
    muted: Match.Maybe(Boolean),
    voiceConf: String,
    joined: Match.Maybe(Boolean)
  });
  const {
    intId
  } = voiceUser;
  const selector = {
    meetingId,
    intId
  };
  const modifier = {
    $set: Object.assign(flat(voiceUser))
  };

  if (voiceUser.talking) {
    const user = VoiceUsers.findOne({
      meetingId,
      intId
    }, {
      fields: {
        startTime: 1
      }
    });
    if (user && !user.startTime) modifier.$set.startTime = Date.now();
    modifier.$set.spoke = true;
    modifier.$set.endTime = null;
    clearSpokeTimeout(meetingId, intId);
  }

  if (!voiceUser.talking) {
    const timeoutHandle = Meteor.setTimeout(() => {
      const user = VoiceUsers.findOne({
        meetingId,
        intId
      }, {
        fields: {
          endTime: 1,
          talking: 1
        }
      });

      if (user) {
        const {
          endTime,
          talking
        } = user;
        const spokeDelay = Date.now() - endTime < TALKING_TIMEOUT;
        if (talking || spokeDelay) return;
        modifier.$set.spoke = false;
        modifier.$set.startTime = null;

        try {
          const numberAffected = VoiceUsers.update(selector, modifier);

          if (numberAffected) {
            Logger.debug('Update voiceUser', {
              voiceUser: intId,
              meetingId
            });
          }
        } catch (err) {
          Logger.error("Update voiceUser=".concat(intId, ": ").concat(err));
        }
      }
    }, TALKING_TIMEOUT);
    spokeTimeoutHandles["".concat(meetingId, "-").concat(intId)] = timeoutHandle;
    modifier.$set.endTime = Date.now();
  }

  try {
    const numberAffected = VoiceUsers.update(selector, modifier);

    if (numberAffected) {
      Logger.debug('Update voiceUser', {
        voiceUser: intId,
        meetingId
      });
    }
  } catch (err) {
    Logger.error("Update voiceUser=".concat(intId, ": ").concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/eventHandlers.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 1);
let handleJoinVoiceUser;
module.link("./handlers/joinVoiceUser", {
  default(v) {
    handleJoinVoiceUser = v;
  }

}, 2);
let handleLeftVoiceUser;
module.link("./handlers/leftVoiceUser", {
  default(v) {
    handleLeftVoiceUser = v;
  }

}, 3);
let handleTalkingVoiceUser;
module.link("./handlers/talkingVoiceUser", {
  default(v) {
    handleTalkingVoiceUser = v;
  }

}, 4);
let handleMutedVoiceUser;
module.link("./handlers/mutedVoiceUser", {
  default(v) {
    handleMutedVoiceUser = v;
  }

}, 5);
let handleGetVoiceUsers;
module.link("./handlers/getVoiceUsers", {
  default(v) {
    handleGetVoiceUsers = v;
  }

}, 6);
let handleVoiceUsers;
module.link("./handlers/voiceUsers", {
  default(v) {
    handleVoiceUsers = v;
  }

}, 7);
let handleMeetingMuted;
module.link("./handlers/meetingMuted", {
  default(v) {
    handleMeetingMuted = v;
  }

}, 8);
RedisPubSub.on('UserLeftVoiceConfToClientEvtMsg', handleLeftVoiceUser);
RedisPubSub.on('UserJoinedVoiceConfToClientEvtMsg', handleJoinVoiceUser);
RedisPubSub.on('UserTalkingVoiceEvtMsg', handleTalkingVoiceUser);
RedisPubSub.on('UserMutedVoiceEvtMsg', handleMutedVoiceUser);
RedisPubSub.on('GetVoiceUsersMeetingRespMsg', processForHTML5ServerOnly(handleGetVoiceUsers));
RedisPubSub.on('SyncGetVoiceUsersRespMsg', handleVoiceUsers);
RedisPubSub.on('MeetingMutedEvtMsg', handleMeetingMuted);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/index.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./publishers");
module.link("./methods");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/methods.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let muteToggle;
module.link("./methods/muteToggle", {
  default(v) {
    muteToggle = v;
  }

}, 1);
let muteAllToggle;
module.link("./methods/muteAllToggle", {
  default(v) {
    muteAllToggle = v;
  }

}, 2);
let muteAllExceptPresenterToggle;
module.link("./methods/muteAllExceptPresenterToggle", {
  default(v) {
    muteAllExceptPresenterToggle = v;
  }

}, 3);
let ejectUserFromVoice;
module.link("./methods/ejectUserFromVoice", {
  default(v) {
    ejectUserFromVoice = v;
  }

}, 4);
Meteor.methods({
  toggleVoice: muteToggle,
  muteAllUsers: muteAllToggle,
  muteAllExceptPresenter: muteAllExceptPresenterToggle,
  ejectUserFromVoice
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/server/publishers.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let VoiceUsers;
module.link("/imports/api/voice-users", {
  default(v) {
    VoiceUsers = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);
let ejectUserFromVoice;
module.link("./methods/ejectUserFromVoice", {
  default(v) {
    ejectUserFromVoice = v;
  }

}, 4);

function voiceUser() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing VoiceUsers was requested by unauth connection ".concat(this.connection.id));
    return VoiceUsers.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId: requesterUserId
  } = tokenValidation;
  const onCloseConnection = Meteor.bindEnvironment(() => {
    try {
      // I used user because voiceUser is the function's name
      const User = VoiceUsers.findOne({
        meetingId,
        requesterUserId
      });

      if (User) {
        ejectUserFromVoice(requesterUserId);
      }
    } catch (e) {
      Logger.error("Exception while executing ejectUserFromVoice for ".concat(requesterUserId, ": ").concat(e));
    }
  });
  Logger.debug('Publishing Voice User', {
    meetingId,
    requesterUserId
  });

  this._session.socket.on('close', _.debounce(onCloseConnection, 100));

  return VoiceUsers.find({
    meetingId
  });
}

function publish() {
  const boundVoiceUser = voiceUser.bind(this);
  return boundVoiceUser(...arguments);
}

Meteor.publish('voiceUsers', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voice-users/index.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const VoiceUsers = new Mongo.Collection('voiceUsers');

if (Meteor.isServer) {
  // types of queries for the voice users:
  // 1. intId
  // 2. meetingId, intId
  VoiceUsers._ensureIndex({
    intId: 1
  });

  VoiceUsers._ensureIndex({
    meetingId: 1,
    intId: 1
  });
}

module.exportDefault(VoiceUsers);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"whiteboard-multi-user":{"server":{"handlers":{"modifyWhiteboardAccess.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/handlers/modifyWhiteboardAccess.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => handleModifyWhiteboardAccess
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let modifyWhiteboardAccess;
module.link("../modifiers/modifyWhiteboardAccess", {
  default(v) {
    modifyWhiteboardAccess = v;
  }

}, 1);

function handleModifyWhiteboardAccess(_ref, meetingId) {
  let {
    body
  } = _ref;
  const {
    multiUser,
    whiteboardId
  } = body;
  check(multiUser, Boolean);
  check(whiteboardId, String);
  check(meetingId, String);
  return modifyWhiteboardAccess(meetingId, whiteboardId, multiUser);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"changeWhiteboardAccess.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/methods/changeWhiteboardAccess.js                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => changeWhiteboardAccess
});
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 3);

function changeWhiteboardAccess(multiUser, whiteboardId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'ModifyWhiteboardAccessPubMsg';
  const {
    meetingId,
    requesterUserId
  } = extractCredentials(this.userId);
  check(multiUser, Boolean);
  check(whiteboardId, String);
  const payload = {
    multiUser,
    whiteboardId
  };
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, requesterUserId, payload);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"modifiers":{"clearWhiteboardMultiUser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/modifiers/clearWhiteboardMultiUser.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => clearWhiteboardMultiUser
});
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let WhiteboardMultiUser;
module.link("/imports/api/whiteboard-multi-user", {
  default(v) {
    WhiteboardMultiUser = v;
  }

}, 1);

function clearWhiteboardMultiUser(meetingId) {
  if (meetingId) {
    try {
      const numberAffected = WhiteboardMultiUser.remove({
        meetingId
      });

      if (numberAffected) {
        Logger.info("Cleared WhiteboardMultiUser (".concat(meetingId, ")"));
      }
    } catch (err) {
      Logger.info("Error clearing WhiteboardMultiUser (".concat(meetingId, "). ").concat(err));
    }
  } else {
    try {
      const numberAffected = WhiteboardMultiUser.remove({});

      if (numberAffected) {
        Logger.info('Cleared WhiteboardMultiUser (all)');
      }
    } catch (err) {
      Logger.info("Error clearing WhiteboardMultiUser (all). ".concat(err));
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"modifyWhiteboardAccess.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/modifiers/modifyWhiteboardAccess.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => modifyWhiteboardAccess
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 0);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 1);
let WhiteboardMultiUser;
module.link("/imports/api/whiteboard-multi-user/", {
  default(v) {
    WhiteboardMultiUser = v;
  }

}, 2);

function modifyWhiteboardAccess(meetingId, whiteboardId, multiUser) {
  check(meetingId, String);
  check(whiteboardId, String);
  check(multiUser, Boolean);
  const selector = {
    meetingId,
    whiteboardId
  };
  const modifier = {
    meetingId,
    whiteboardId,
    multiUser
  };

  try {
    const {
      insertedId
    } = WhiteboardMultiUser.upsert(selector, modifier);

    if (insertedId) {
      Logger.info("Added multiUser flag=".concat(multiUser, " meetingId=").concat(meetingId, " whiteboardId=").concat(whiteboardId));
    } else {
      Logger.info("Upserted multiUser flag=".concat(multiUser, " meetingId=").concat(meetingId, " whiteboardId=").concat(whiteboardId));
    }
  } catch (err) {
    Logger.error("Error while adding an entry to Multi-User collection: ".concat(err));
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"eventHandlers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/eventHandlers.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RedisPubSub;
module.link("/imports/startup/server/redis", {
  default(v) {
    RedisPubSub = v;
  }

}, 0);
let processForHTML5ServerOnly;
module.link("/imports/api/common/server/helpers", {
  processForHTML5ServerOnly(v) {
    processForHTML5ServerOnly = v;
  }

}, 1);
let handleGetWhiteboardAccess;
module.link("./handlers/modifyWhiteboardAccess", {
  default(v) {
    handleGetWhiteboardAccess = v;
  }

}, 2);
RedisPubSub.on('GetWhiteboardAccessRespMsg', processForHTML5ServerOnly(handleGetWhiteboardAccess));
RedisPubSub.on('SyncGetWhiteboardAccessRespMsg', handleGetWhiteboardAccess);
RedisPubSub.on('ModifyWhiteboardAccessEvtMsg', handleGetWhiteboardAccess);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/index.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./eventHandlers");
module.link("./methods");
module.link("./publishers");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/methods.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let changeWhiteboardAccess;
module.link("./methods/changeWhiteboardAccess", {
  default(v) {
    changeWhiteboardAccess = v;
  }

}, 1);
Meteor.methods({
  changeWhiteboardAccess
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publishers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/server/publishers.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let WhiteboardMultiUser;
module.link("/imports/api/whiteboard-multi-user/", {
  default(v) {
    WhiteboardMultiUser = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Logger;
module.link("/imports/startup/server/logger", {
  default(v) {
    Logger = v;
  }

}, 2);
let AuthTokenValidation, ValidationStates;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  },

  ValidationStates(v) {
    ValidationStates = v;
  }

}, 3);

function whiteboardMultiUser() {
  const tokenValidation = AuthTokenValidation.findOne({
    connectionId: this.connection.id
  });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn("Publishing WhiteboardMultiUser was requested by unauth connection ".concat(this.connection.id));
    return WhiteboardMultiUser.find({
      meetingId: ''
    });
  }

  const {
    meetingId,
    userId
  } = tokenValidation;
  Logger.debug('Publishing WhiteboardMultiUser', {
    meetingId,
    userId
  });
  return WhiteboardMultiUser.find({
    meetingId
  });
}

function publish() {
  const boundMultiUser = whiteboardMultiUser.bind(this);
  return boundMultiUser(...arguments);
}

Meteor.publish('whiteboard-multi-user', publish);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/whiteboard-multi-user/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
const WhiteboardMultiUser = new Mongo.Collection('whiteboard-multi-user');

if (Meteor.isServer) {
  // types of queries for the whiteboard-multi-user:
  // 1. meetingId
  WhiteboardMultiUser._ensureIndex({
    meetingId: 1
  });
}

module.exportDefault(WhiteboardMultiUser);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"common":{"server":{"helpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/common/server/helpers.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  spokeTimeoutHandles: () => spokeTimeoutHandles,
  clearSpokeTimeout: () => clearSpokeTimeout,
  indexOf: () => indexOf,
  processForHTML5ServerOnly: () => processForHTML5ServerOnly,
  hashSHA1: () => hashSHA1,
  extractCredentials: () => extractCredentials
});
let sha1;
module.link("crypto-js/sha1", {
  default(v) {
    sha1 = v;
  }

}, 0);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 1);
const MSG_DIRECT_TYPE = 'DIRECT';
const NODE_USER = 'nodeJSapp';
const spokeTimeoutHandles = {};

const clearSpokeTimeout = (meetingId, userId) => {
  if (spokeTimeoutHandles["".concat(meetingId, "-").concat(userId)]) {
    Meteor.clearTimeout(spokeTimeoutHandles["".concat(meetingId, "-").concat(userId)]);
    delete spokeTimeoutHandles["".concat(meetingId, "-").concat(userId)];
  }
};

const indexOf = [].indexOf || function (item) {
  for (let i = 0, l = this.length; i < l; i += 1) {
    if (i in this && this[i] === item) {
      return i;
    }
  }

  return -1;
};

const processForHTML5ServerOnly = fn => function (message) {
  const {
    envelope
  } = message;
  const {
    routing
  } = envelope;
  const {
    msgType,
    meetingId,
    userId
  } = routing;
  const selector = {
    userId,
    meetingId
  };
  const user = Users.findOne(selector);
  const shouldSkip = user && msgType === MSG_DIRECT_TYPE && userId !== NODE_USER && user.clientType !== 'HTML5';
  if (shouldSkip) return () => {};

  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return fn(message, ...args);
};

const hashSHA1 = str => sha1(str).toString();

const extractCredentials = credentials => {
  if (!credentials) return {};
  const credentialsArray = credentials.split('--');
  const meetingId = credentialsArray[0];
  const requesterUserId = credentialsArray[1];
  return {
    meetingId,
    requesterUserId
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"startup":{"server":{"ClientConnections.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/ClientConnections.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Logger;
module.link("./logger", {
  default(v) {
    Logger = v;
  }

}, 0);
let userLeaving;
module.link("/imports/api/users/server/methods/userLeaving", {
  default(v) {
    userLeaving = v;
  }

}, 1);
let extractCredentials;
module.link("/imports/api/common/server/helpers", {
  extractCredentials(v) {
    extractCredentials = v;
  }

}, 2);
let AuthTokenValidation;
module.link("/imports/api/auth-token-validation", {
  default(v) {
    AuthTokenValidation = v;
  }

}, 3);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 4);
const {
  enabled,
  syncInterval
} = Meteor.settings.public.syncUsersWithConnectionManager;

class ClientConnections {
  constructor() {
    Logger.debug('Initializing client connections structure', {
      logCode: 'client_connections_init'
    });
    this.connections = new Map();
    setInterval(() => {
      this.print();
    }, 30000);

    if (enabled) {
      const syncConnections = Meteor.bindEnvironment(() => {
        this.syncConnectionsWithServer();
      });
      setInterval(() => {
        syncConnections();
      }, syncInterval);
    }
  }

  add(sessionId, connection) {
    Logger.info('Client connections add called', {
      logCode: 'client_connections_add',
      extraInfo: {
        sessionId,
        connection
      }
    });

    if (!sessionId || !connection) {
      Logger.error("Error on add new client connection. sessionId=".concat(sessionId, " connection=").concat(connection.id), {
        logCode: 'client_connections_add_error',
        extraInfo: {
          sessionId,
          connection
        }
      });
      return;
    }

    const {
      meetingId,
      requesterUserId: userId
    } = extractCredentials(sessionId);

    if (!meetingId) {
      Logger.error('Error on add new client connection. sessionId=${sessionId} connection=${connection.id}', {
        logCode: 'client_connections_add_error_meeting_id_null',
        extraInfo: {
          meetingId,
          userId
        }
      });
      return false;
    }

    if (!this.exists(meetingId)) {
      Logger.info("Meeting not found in connections: meetingId=".concat(meetingId));
      this.createMeetingConnections(meetingId);
    }

    const sessionConnections = this.connections.get(meetingId);

    if (sessionConnections.has(userId) && sessionConnections.get(userId).includes(connection.id)) {
      Logger.info("Connection already exists for user. userId=".concat(userId, " connectionId=").concat(connection.id));
      return false;
    }

    connection.onClose(Meteor.bindEnvironment(() => {
      userLeaving(meetingId, userId, connection.id);
    }));
    Logger.info("Adding new connection for sessionId=".concat(sessionId, " connection=").concat(connection.id));

    if (!sessionConnections.has(userId)) {
      Logger.info("Creating connections poll for ".concat(userId));
      sessionConnections.set(userId, []);
      return sessionConnections.get(userId).push(connection.id);
    } else {
      return sessionConnections.get(userId).push(connection.id);
    }
  }

  createMeetingConnections(meetingId) {
    Logger.info("Creating meeting in connections. meetingId=".concat(meetingId));
    if (!this.exists(meetingId)) return this.connections.set(meetingId, new Map());
  }

  exists(meetingId) {
    return this.connections.has(meetingId);
  }

  getConnectionsForClient(sessionId) {
    var _this$connections$get;

    const {
      meetingId,
      requesterUserId: userId
    } = extractCredentials(sessionId);
    return (_this$connections$get = this.connections.get(meetingId)) === null || _this$connections$get === void 0 ? void 0 : _this$connections$get.get(userId);
  }

  print() {
    const mapConnectionsObj = {};
    this.connections.forEach((value, key) => {
      mapConnectionsObj[key] = {};
      value.forEach((v, k) => {
        mapConnectionsObj[key][k] = v;
      });
    });
    Logger.info('Active connections', mapConnectionsObj);
  }

  removeClientConnection(sessionId) {
    let connectionId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    Logger.info("Removing connectionId for user. sessionId=".concat(sessionId, " connectionId=").concat(connectionId));
    const {
      meetingId,
      requesterUserId: userId
    } = extractCredentials(sessionId);
    const meetingConnections = this.connections.get(meetingId);

    if (meetingConnections === null || meetingConnections === void 0 ? void 0 : meetingConnections.has(userId)) {
      const filteredConnections = meetingConnections.get(userId).filter(c => c !== connectionId);
      return connectionId && filteredConnections.length ? meetingConnections.set(userId, filteredConnections) : meetingConnections.delete(userId);
    }

    return false;
  }

  removeMeeting(meetingId) {
    Logger.debug("Removing connections for meeting=".concat(meetingId));
    return this.connections.delete(meetingId);
  }

  syncConnectionsWithServer() {
    Logger.info('Syncing ClientConnections with server');
    const activeConnections = Array.from(Meteor.server.sessions.keys());
    Logger.debug("Found ".concat(activeConnections.length, " active connections in server"));
    const onlineUsers = AuthTokenValidation.find({
      connectionId: {
        $in: activeConnections
      }
    }, {
      fields: {
        meetingId: 1,
        userId: 1
      }
    }).fetch();
    const onlineUsersId = onlineUsers.map((_ref) => {
      let {
        userId
      } = _ref;
      return userId;
    });
    const usersQuery = {
      userId: {
        $nin: onlineUsersId
      }
    };
    const userWithoutConnectionIds = Users.find(usersQuery, {
      fields: {
        meetingId: 1,
        userId: 1
      }
    }).fetch();
    const removedUsersWithoutConnection = Users.remove(usersQuery);

    if (removedUsersWithoutConnection) {
      Logger.info("Removed ".concat(removedUsersWithoutConnection, " users that are not connected"));
      Logger.info("Clearing connections");

      try {
        userWithoutConnectionIds.forEach((_ref2) => {
          let {
            meetingId,
            userId
          } = _ref2;
          this.removeClientConnection("".concat(meetingId, "--").concat(userId));
        });
      } catch (err) {
        Logger.error('Error on sync ClientConnections', err);
      }
    }
  }

}

const ClientConnectionsSingleton = new ClientConnections();
module.exportDefault(ClientConnectionsSingleton);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/index.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _objectSpread;

module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }

}, 0);
module.export({
  eventEmitter: () => eventEmitter,
  redisPubSub: () => redisPubSub
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let WebAppInternals;
module.link("meteor/webapp", {
  WebAppInternals(v) {
    WebAppInternals = v;
  }

}, 1);
let Langmap;
module.link("langmap", {
  default(v) {
    Langmap = v;
  }

}, 2);
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }

}, 3);
let Users;
module.link("/imports/api/users", {
  default(v) {
    Users = v;
  }

}, 4);
module.link("./settings");
let lookupUserAgent;
module.link("useragent", {
  lookup(v) {
    lookupUserAgent = v;
  }

}, 5);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 6);
let Logger;
module.link("./logger", {
  default(v) {
    Logger = v;
  }

}, 7);
let Redis;
module.link("./redis", {
  default(v) {
    Redis = v;
  }

}, 8);
let setMinBrowserVersions;
module.link("./minBrowserVersion", {
  default(v) {
    setMinBrowserVersions = v;
  }

}, 9);
let guestWaitHtml = '';
const env = Meteor.isDevelopment ? 'development' : 'production';
const meteorRoot = fs.realpathSync("".concat(process.cwd(), "/../"));
const applicationRoot = env === 'development' ? fs.realpathSync("".concat(meteorRoot, "'/../../../../public/locales/")) : fs.realpathSync("".concat(meteorRoot, "/../programs/web.browser/app/locales/"));
const AVAILABLE_LOCALES = fs.readdirSync("".concat(applicationRoot));
const FALLBACK_LOCALES = JSON.parse(Assets.getText('config/fallbackLocales.json'));
process.on('uncaughtException', err => {
  Logger.error("uncaughtException: ".concat(err));
  process.exit(1);
});
process.on('uncaughtException', err => {
  Logger.error("uncaughtException: ".concat(err));
  process.exit(1);
});
Meteor.startup(() => {
  const APP_CONFIG = Meteor.settings.public.app;
  const CDN_URL = APP_CONFIG.cdn;
  const instanceId = parseInt(process.env.INSTANCE_ID, 10) || 1;
  Logger.warn("Started bbb-html5 process with instanceId=".concat(instanceId));
  const {
    customHeartbeat
  } = APP_CONFIG;

  if (customHeartbeat) {
    Logger.warn('Custom heartbeat functions are enabled'); // https://github.com/sockjs/sockjs-node/blob/1ef08901f045aae7b4df0f91ef598d7a11e82897/lib/transport/websocket.js#L74-L82

    const newHeartbeat = function heartbeat() {
      const currentTime = new Date().getTime(); // Skipping heartbeat, because websocket is sending data

      if (currentTime - this.ws.lastSentFrameTimestamp < 10000) {
        try {
          Logger.info('Skipping heartbeat, because websocket is sending data', {
            currentTime,
            lastSentFrameTimestamp: this.ws.lastSentFrameTimestamp,
            userId: this.session.connection._meteorSession.userId
          });
          return;
        } catch (err) {
          Logger.error("Skipping heartbeat error: ".concat(err));
        }
      }

      const supportsHeartbeats = this.ws.ping(null, () => clearTimeout(this.hto_ref));

      if (supportsHeartbeats) {
        this.hto_ref = setTimeout(() => {
          try {
            Logger.info('Heartbeat timeout', {
              userId: this.session.connection._meteorSession.userId,
              sentAt: currentTime,
              now: new Date().getTime()
            });
          } catch (err) {
            Logger.error("Heartbeat timeout error: ".concat(err));
          }
        }, Meteor.server.options.heartbeatTimeout);
      } else {
        Logger.error('Unexpected error supportsHeartbeats=false');
      }
    }; // https://github.com/davhani/hagty/blob/6a5c78e9ae5a5e4ade03e747fb4cc8ea2df4be0c/faye-websocket/lib/faye/websocket/api.js#L84-L88


    const newSend = function send(data) {
      try {
        this.lastSentFrameTimestamp = new Date().getTime();

        if (this.meteorHeartbeat) {
          // Call https://github.com/meteor/meteor/blob/1e7e56eec8414093cd0c1c70750b894069fc972a/packages/ddp-common/heartbeat.js#L80-L88
          this.meteorHeartbeat._seenPacket = true;

          if (this.meteorHeartbeat._heartbeatTimeoutHandle) {
            this.meteorHeartbeat._clearHeartbeatTimeoutTimer();
          }
        }

        if (this.readyState > 1
        /* API.OPEN = 1 */
        ) return false;
        if (!(data instanceof Buffer)) data = String(data);
        return this._driver.messages.write(data);
      } catch (err) {
        console.error('Error on send data', err);
        return false;
      }
    };

    Meteor.setInterval(() => {
      for (const session of Meteor.server.sessions.values()) {
        const {
          socket
        } = session;
        const recv = socket._session.recv;

        if (session.bbbFixApplied || !recv || !recv.ws) {
          continue;
        }

        recv.ws.meteorHeartbeat = session.heartbeat;
        recv.__proto__.heartbeat = newHeartbeat;
        recv.ws.__proto__.send = newSend;
        session.bbbFixApplied = true;
      }
    }, 5000);
  }

  if (CDN_URL.trim()) {
    // Add CDN
    BrowserPolicy.content.disallowEval();
    BrowserPolicy.content.allowInlineScripts();
    BrowserPolicy.content.allowInlineStyles();
    BrowserPolicy.content.allowImageDataUrl(CDN_URL);
    BrowserPolicy.content.allowFontDataUrl(CDN_URL);
    BrowserPolicy.content.allowOriginForAll(CDN_URL);
    WebAppInternals.setBundledJsCssPrefix(CDN_URL + APP_CONFIG.basename + Meteor.settings.public.app.instanceId);
    const fontRegExp = /\.(eot|ttf|otf|woff|woff2)$/;
    WebApp.rawConnectHandlers.use('/', (req, res, next) => {
      if (fontRegExp.test(req._parsedUrl.pathname)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Vary', 'Origin');
        res.setHeader('Pragma', 'public');
        res.setHeader('Cache-Control', '"public"');
      }

      return next();
    });
  }

  setMinBrowserVersions();
  Logger.warn("SERVER STARTED.\n  ENV=".concat(env, "\n  nodejs version=").concat(process.version, "\n  BBB_HTML5_ROLE=").concat(process.env.BBB_HTML5_ROLE, "\n  INSTANCE_ID=").concat(instanceId, "\n  PORT=").concat(process.env.PORT, "\n  CDN=").concat(CDN_URL, "\n"), APP_CONFIG);
});

const generateLocaleOptions = () => {
  try {
    Logger.warn('Calculating aggregateLocales (heavy)'); // remove duplicated locales (always remove more generic if same name)

    const tempAggregateLocales = AVAILABLE_LOCALES.map(file => file.replace('.json', '')).map(file => file.replace('_', '-')).map(locale => {
      const localeName = (Langmap[locale] || {}).nativeName || (FALLBACK_LOCALES[locale] || {}).nativeName || locale;
      return {
        locale,
        name: localeName
      };
    }).reverse().filter((item, index, self) => index === self.findIndex(i => i.name === item.name)).reverse();
    Logger.warn("Total locales: ".concat(tempAggregateLocales.length), tempAggregateLocales);
    return tempAggregateLocales;
  } catch (e) {
    Logger.error("'Could not process locales error: ".concat(e));
    return [];
  }
};

let avaibleLocalesNamesJSON = JSON.stringify(generateLocaleOptions());
WebApp.connectHandlers.use('/check', (req, res) => {
  const payload = {
    html5clientStatus: 'running'
  };
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify(payload));
});
WebApp.connectHandlers.use('/locale', (req, res) => {
  const APP_CONFIG = Meteor.settings.public.app;
  const fallback = APP_CONFIG.defaultSettings.application.fallbackLocale;
  const override = APP_CONFIG.defaultSettings.application.overrideLocale;
  const browserLocale = override && req.query.init === 'true' ? override.split(/[-_]/g) : req.query.locale.split(/[-_]/g);
  let localeFile = fallback;
  const usableLocales = AVAILABLE_LOCALES.map(file => file.replace('.json', '')).reduce((locales, locale) => locale.match(browserLocale[0]) ? [...locales, locale] : locales, []);
  let normalizedLocale;

  if (browserLocale.length > 1) {
    normalizedLocale = "".concat(browserLocale[0], "_").concat(browserLocale[1].toUpperCase());
    const normDefault = usableLocales.find(locale => normalizedLocale === locale);
    if (normDefault) localeFile = normDefault;
  }

  const regionDefault = usableLocales.find(locale => browserLocale[0] === locale);

  if (localeFile === fallback && regionDefault !== localeFile) {
    localeFile = regionDefault;
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    normalizedLocale: localeFile,
    regionDefaultLocale: regionDefault && regionDefault !== localeFile ? regionDefault : ''
  }));
});
WebApp.connectHandlers.use('/locale-list', (req, res) => {
  if (!avaibleLocalesNamesJSON) {
    avaibleLocalesNamesJSON = JSON.stringify(generateLocaleOptions());
  }

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(avaibleLocalesNamesJSON);
});
WebApp.connectHandlers.use('/feedback', (req, res) => {
  req.on('data', Meteor.bindEnvironment(data => {
    const body = JSON.parse(data);
    const {
      meetingId,
      userId,
      authToken,
      userName: reqUserName,
      comment,
      rating
    } = body;
    check(meetingId, String);
    check(userId, String);
    check(authToken, String);
    check(reqUserName, String);
    check(comment, String);
    check(rating, Number);
    const user = Users.findOne({
      meetingId,
      userId,
      authToken
    });

    if (!user) {
      Logger.warn('Couldn\'t find user for feedback');
    }

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok'
    }));
    body.userName = user ? user.name : "[unconfirmed] ".concat(reqUserName);

    const feedback = _objectSpread({}, body);

    Logger.info('FEEDBACK LOG:', feedback);
  }));
});
WebApp.connectHandlers.use('/useragent', (req, res) => {
  const userAgent = req.headers['user-agent'];
  let response = 'No user agent found in header';

  if (userAgent) {
    response = lookupUserAgent(userAgent).toString();
  }

  Logger.info("The requesting user agent is ".concat(response)); // res.setHeader('Content-Type', 'application/json');

  res.writeHead(200);
  res.end(response);
});
WebApp.connectHandlers.use('/guestWait', (req, res) => {
  if (!guestWaitHtml) {
    try {
      guestWaitHtml = Assets.getText('static/guest-wait/guest-wait.html');
    } catch (e) {
      Logger.warn("Could not process guest wait html file: ".concat(e));
    }
  }

  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(guestWaitHtml);
});
const eventEmitter = Redis.emitter;
const redisPubSub = Redis;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logger.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/logger.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  logger: () => logger
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let createLogger, format, transports;
module.link("winston", {
  createLogger(v) {
    createLogger = v;
  },

  format(v) {
    format = v;
  },

  transports(v) {
    transports = v;
  }

}, 1);
const LOG_CONFIG = Meteor.settings.private.serverLog || {};
const {
  level
} = LOG_CONFIG;
const Logger = createLogger({
  level,
  format: format.combine(format.colorize({
    level: true
  }), format.splat(), format.simple()),
  transports: [// console logging
  new transports.Console({
    prettyPrint: false,
    humanReadableUnhandledException: true,
    colorize: true,
    handleExceptions: true,
    level
  })]
});
module.exportDefault(Logger);
const logger = Logger;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"metrics.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/metrics.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.link("path", {
  default(v) {
    path = v;
  }

}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let Logger;
module.link("./logger", {
  default(v) {
    Logger = v;
  }

}, 3);
const {
  metricsDumpIntervalMs,
  metricsFolderPath,
  removeMeetingOnEnd
} = Meteor.settings.private.redis.metrics;

class Metrics {
  constructor() {
    this.metrics = {};
  }

  addEvent(meetingId, eventName, messageLength) {
    if (!this.metrics.hasOwnProperty(meetingId)) {
      this.metrics[meetingId] = {
        currentlyInQueue: {},
        wasInQueue: {}
      };
    }

    const {
      currentlyInQueue
    } = this.metrics[meetingId];

    if (!currentlyInQueue.hasOwnProperty(eventName)) {
      currentlyInQueue[eventName] = {
        count: 1,
        payloadSize: messageLength
      };
    } else {
      currentlyInQueue[eventName].count += 1;
      currentlyInQueue[eventName].payloadSize += messageLength;
    }
  }

  processEvent(meetingId, eventName, size, processingStartTimestamp) {
    const currentProcessingTimestamp = Date.now();
    const processTime = currentProcessingTimestamp - processingStartTimestamp;

    if (!this.metrics[meetingId].wasInQueue.hasOwnProperty(eventName)) {
      this.metrics[meetingId].wasInQueue[eventName] = {
        count: 1,
        payloadSize: {
          min: size,
          max: size,
          last: size,
          total: size,
          avg: size
        },
        processingTime: {
          min: processTime,
          max: processTime,
          last: processTime,
          total: processTime,
          avg: processTime
        }
      };
      this.metrics[meetingId].currentlyInQueue[eventName].count -= 1;

      if (!this.metrics[meetingId].currentlyInQueue[eventName].count) {
        delete this.metrics[meetingId].currentlyInQueue[eventName];
      }
    } else {
      const {
        currentlyInQueue,
        wasInQueue
      } = this.metrics[meetingId];
      currentlyInQueue[eventName].count -= 1;

      if (!currentlyInQueue[eventName].count) {
        delete currentlyInQueue[eventName];
      }

      const {
        payloadSize,
        processingTime
      } = wasInQueue[eventName];
      wasInQueue[eventName].count += 1;
      payloadSize.last = size;
      payloadSize.total += size;
      if (payloadSize.min > size) payloadSize.min = size;
      if (payloadSize.max < size) payloadSize.max = size;
      payloadSize.avg = payloadSize.total / wasInQueue[eventName].count;
      if (processingTime.min > processTime) processingTime.min = processTime;
      if (processingTime.max < processTime) processingTime.max = processTime;
      processingTime.last = processTime;
      processingTime.total += processTime;
      processingTime.avg = processingTime.total / wasInQueue[eventName].count;
    }
  }

  setAnnotationQueueLength(meetingId, size) {
    this.metrics[meetingId].annotationQueueLength = size;
  }

  startDumpFile() {
    Meteor.setInterval(() => {
      try {
        const fileDate = new Date();
        const fullYear = fileDate.getFullYear();
        const month = (fileDate.getMonth() + 1).toString().padStart(2, '0');
        const day = fileDate.getDate().toString().padStart(2, '0');
        const hour = fileDate.getHours().toString().padStart(2, '0');
        const minutes = fileDate.getMinutes().toString().padStart(2, '0');
        const seconds = fileDate.getSeconds().toString().padStart(2, '0');
        const folderName = "".concat(fullYear).concat(month).concat(day, "_").concat(hour);
        const fileName = "".concat(folderName).concat(minutes).concat(seconds, "_metrics.json");
        const folderPath = path.join(metricsFolderPath, folderName);
        const fullFilePath = path.join(folderPath, fileName);

        if (!fs.existsSync(folderPath)) {
          Logger.debug("Creating folder: ".concat(folderPath));
          fs.mkdirSync(folderPath);
        }

        fs.writeFileSync(fullFilePath, JSON.stringify(this.metrics));
        Logger.info('Metric file successfully written');
      } catch (err) {
        Logger.error('Error on writing metrics to disk.', err);
      }
    }, metricsDumpIntervalMs);
  }

  removeMeeting(meetingId) {
    if (removeMeetingOnEnd) {
      Logger.info("Removing meeting ".concat(meetingId, " from metrics"));
      delete this.metrics[meetingId];
    } else {
      Logger.info("Skipping remove of meeting ".concat(meetingId, " from metrics"));
    }
  }

}

const metricsSingleton = new Metrics();
module.exportDefault(metricsSingleton);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"minBrowserVersion.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/minBrowserVersion.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let setMinimumBrowserVersions;
module.link("meteor/modern-browsers", {
  setMinimumBrowserVersions(v) {
    setMinimumBrowserVersions = v;
  }

}, 1);

const setMinBrowserVersions = () => {
  const {
    minBrowserVersions
  } = Meteor.settings.private;
  const versions = {};
  minBrowserVersions.forEach(elem => {
    let {
      version
    } = elem;
    if (version === 'Infinity') version = Infinity;
    versions[elem.browser] = version;
  });
  setMinimumBrowserVersions(versions, 'bbb-min');
};

module.exportDefault(setMinBrowserVersions);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"redis.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/redis.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Redis;
module.link("redis", {
  default(v) {
    Redis = v;
  }

}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let EventEmitter2;
module.link("eventemitter2", {
  EventEmitter2(v) {
    EventEmitter2 = v;
  }

}, 2);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 3);
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }

}, 4);
let Logger;
module.link("./logger", {
  default(v) {
    Logger = v;
  }

}, 5);
let Metrics;
module.link("./metrics", {
  default(v) {
    Metrics = v;
  }

}, 6);
// Fake meetingId used for messages that have no meetingId
const NO_MEETING_ID = '_';
const {
  queueMetrics
} = Meteor.settings.private.redis.metrics;

const makeEnvelope = (channel, eventName, header, body, routing) => {
  const envelope = {
    envelope: {
      name: eventName,
      routing: routing || {
        sender: 'html5-server'
      },
      timestamp: Date.now()
    },
    core: {
      header,
      body
    }
  };
  return JSON.stringify(envelope);
};

class MeetingMessageQueue {
  constructor(eventEmitter) {
    let asyncMessages = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let redisDebugEnabled = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    this.asyncMessages = asyncMessages;
    this.emitter = eventEmitter;
    this.queue = new PowerQueue();
    this.redisDebugEnabled = redisDebugEnabled;
    this.handleTask = this.handleTask.bind(this);
    this.queue.taskHandler = this.handleTask;
  }

  handleTask(data, next) {
    const {
      channel
    } = data;
    const {
      envelope
    } = data.parsedMessage;
    const {
      header
    } = data.parsedMessage.core;
    const {
      body
    } = data.parsedMessage.core;
    const {
      meetingId
    } = header;
    const eventName = header.name;
    const isAsync = this.asyncMessages.includes(channel) || this.asyncMessages.includes(eventName);
    const beginHandleTimestamp = Date.now();
    let called = false;
    check(eventName, String);
    check(body, Object);

    const callNext = () => {
      if (called) return;

      if (this.redisDebugEnabled) {
        Logger.debug("Redis: ".concat(eventName, " completed ").concat(isAsync ? 'async' : 'sync'));
      }

      called = true;

      if (queueMetrics) {
        const queueId = meetingId || NO_MEETING_ID;
        const dataLength = JSON.stringify(data).length;
        Metrics.processEvent(queueId, eventName, dataLength, beginHandleTimestamp);
      }

      const queueLength = this.queue.length();

      if (queueLength > 100) {
        Logger.warn("Redis: MeetingMessageQueue for meetingId=".concat(meetingId, " has queue size=").concat(queueLength, " "));
      }

      next();
    };

    const onError = reason => {
      Logger.error("".concat(eventName, ": ").concat(reason.stack ? reason.stack : reason));
      callNext();
    };

    try {
      if (this.redisDebugEnabled) {
        Logger.debug("Redis: ".concat(JSON.stringify(data.parsedMessage.core), " emitted"));
      }

      if (isAsync) {
        callNext();
      }

      this.emitter.emitAsync(eventName, {
        envelope,
        header,
        body
      }, meetingId).then(callNext).catch(onError);
    } catch (reason) {
      onError(reason);
    }
  }

  add() {
    return this.queue.add(...arguments);
  }

}

class RedisPubSub {
  static handlePublishError(err) {
    if (err) {
      Logger.error(err);
    }
  }

  constructor() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.config = config;
    this.didSendRequestEvent = false;
    const host = process.env.REDIS_HOST || Meteor.settings.private.redis.host;
    const redisConf = Meteor.settings.private.redis;
    this.instanceId = parseInt(process.env.INSTANCE_ID, 10) || 1; // 1 also handles running in dev mode

    this.role = process.env.BBB_HTML5_ROLE;
    this.customRedisChannel = "to-html5-redis-channel".concat(this.instanceId);
    const {
      password,
      port
    } = redisConf;

    if (password) {
      this.pub = Redis.createClient({
        host,
        port,
        password
      });
      this.sub = Redis.createClient({
        host,
        port,
        password
      });
      this.pub.auth(password);
      this.sub.auth(password);
    } else {
      this.pub = Redis.createClient({
        host,
        port
      });
      this.sub = Redis.createClient({
        host,
        port
      });
    }

    if (queueMetrics) {
      Metrics.startDumpFile();
    }

    this.emitter = new EventEmitter2();
    this.meetingsQueues = {}; // We create this _ meeting queue because we need to be able to handle system messages (no meetingId in core.header)

    this.meetingsQueues[NO_MEETING_ID] = new MeetingMessageQueue(this.emitter, this.config.async, this.config.debug);
    this.handleSubscribe = this.handleSubscribe.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  init() {
    this.sub.on('psubscribe', Meteor.bindEnvironment(this.handleSubscribe));
    this.sub.on('pmessage', Meteor.bindEnvironment(this.handleMessage));
    const channelsToSubscribe = this.config.subscribeTo;
    channelsToSubscribe.push(this.customRedisChannel);

    switch (this.role) {
      case 'frontend':
        this.sub.psubscribe('from-akka-apps-frontend-redis-channel');

        if (this.redisDebugEnabled) {
          Logger.debug("Redis: NodeJSPool:".concat(this.instanceId, " Role: frontend. Subscribed to 'from-akka-apps-frontend-redis-channel'"));
        }

        break;

      case 'backend':
        channelsToSubscribe.forEach(channel => {
          this.sub.psubscribe(channel);

          if (this.redisDebugEnabled) {
            Logger.debug("Redis: NodeJSPool:".concat(this.instanceId, " Role: backend. Subscribed to '").concat(channelsToSubscribe, "'"));
          }
        });
        break;

      default:
        this.sub.psubscribe('from-akka-apps-frontend-redis-channel');
        channelsToSubscribe.forEach(channel => {
          this.sub.psubscribe(channel);

          if (this.redisDebugEnabled) {
            Logger.debug("Redis: NodeJSPool:".concat(this.instanceId, " Role:").concat(this.role, " (likely only one nodejs running, doing both frontend and backend. Dev env? ). Subscribed to '").concat(channelsToSubscribe, "'"));
          }
        });
        break;
    }
  }

  updateConfig(config) {
    this.config = Object.assign({}, this.config, config);
    this.redisDebugEnabled = this.config.debug;
  } // TODO: Move this out of this class, maybe pass as a callback to init?


  handleSubscribe() {
    if (this.didSendRequestEvent || this.role === 'frontend') return; // populate collections with pre-existing data

    const REDIS_CONFIG = Meteor.settings.private.redis;
    const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
    const EVENT_NAME = 'GetAllMeetingsReqMsg';
    const body = {
      requesterId: 'nodeJSapp',
      html5InstanceId: this.instanceId
    };
    this.publishSystemMessage(CHANNEL, EVENT_NAME, body);
    this.didSendRequestEvent = true;
  }

  handleMessage(pattern, channel, message) {
    const parsedMessage = JSON.parse(message);
    const {
      ignored: ignoredMessages,
      async
    } = this.config;
    const eventName = parsedMessage.core.header.name;

    if (ignoredMessages.includes(channel) || ignoredMessages.includes(eventName)) {
      if (eventName === 'CheckAlivePongSysMsg') {
        return;
      }

      if (this.redisDebugEnabled) {
        Logger.debug("Redis: ".concat(eventName, " skipped"));
      }

      return;
    }

    if (this.redisDebugEnabled) {
      Logger.warn('Received event to handle', {
        date: new Date().toISOString(),
        eventName
      });
    } // System messages like Create / Destroy Meeting, etc do not have core.header.meetingId.
    // Process them in MeetingQueue['_']  --- the NO_MEETING queueId


    const meetingIdFromMessageCoreHeader = parsedMessage.core.header.meetingId || NO_MEETING_ID;

    if (this.role === 'frontend') {
      // receiving this message means we need to look at it. Frontends do not have instanceId.
      if (meetingIdFromMessageCoreHeader === NO_MEETING_ID) {
        // if this is a system message
        if (eventName === 'MeetingCreatedEvtMsg' || eventName === 'SyncGetMeetingInfoRespMsg') {
          const meetingIdFromMessageMeetingProp = parsedMessage.core.body.props.meetingProp.intId;
          this.meetingsQueues[meetingIdFromMessageMeetingProp] = new MeetingMessageQueue(this.emitter, async, this.redisDebugEnabled);

          if (this.redisDebugEnabled) {
            Logger.warn('Created frontend queue for meeting', {
              date: new Date().toISOString(),
              eventName,
              meetingIdFromMessageMeetingProp
            });
          }
        }
      }

      if (!this.meetingsQueues[meetingIdFromMessageCoreHeader]) {
        Logger.warn("Frontend meeting queue had not been initialized   ".concat(message), {
          eventName,
          meetingIdFromMessageCoreHeader
        });
        this.meetingsQueues[NO_MEETING_ID].add({
          pattern,
          channel,
          eventName,
          parsedMessage
        });
      } else {
        // process the event - whether it's a system message or not, the meetingIdFromMessageCoreHeader value is adjusted
        this.meetingsQueues[meetingIdFromMessageCoreHeader].add({
          pattern,
          channel,
          eventName,
          parsedMessage
        });
      }
    } else {
      if (meetingIdFromMessageCoreHeader === NO_MEETING_ID) {
        var _parsedMessage$core$b, _parsedMessage$core$b2, _parsedMessage$core$b3, _parsedMessage$core$b4;

        // if this is a system message
        const meetingIdFromMessageMeetingProp = (_parsedMessage$core$b = parsedMessage.core.body.props) === null || _parsedMessage$core$b === void 0 ? void 0 : (_parsedMessage$core$b2 = _parsedMessage$core$b.meetingProp) === null || _parsedMessage$core$b2 === void 0 ? void 0 : _parsedMessage$core$b2.intId;
        const instanceIdFromMessage = (_parsedMessage$core$b3 = parsedMessage.core.body.props) === null || _parsedMessage$core$b3 === void 0 ? void 0 : (_parsedMessage$core$b4 = _parsedMessage$core$b3.systemProps) === null || _parsedMessage$core$b4 === void 0 ? void 0 : _parsedMessage$core$b4.html5InstanceId; // end meeting message does not seem to have systemProps

        if (this.instanceId === instanceIdFromMessage) {
          // create queue or destroy queue
          if (eventName === 'MeetingCreatedEvtMsg' || eventName === 'SyncGetMeetingInfoRespMsg') {
            this.meetingsQueues[meetingIdFromMessageMeetingProp] = new MeetingMessageQueue(this.emitter, async, this.redisDebugEnabled);

            if (this.redisDebugEnabled) {
              Logger.warn('Created backend queue for meeting', {
                date: new Date().toISOString(),
                eventName,
                meetingIdFromMessageMeetingProp
              });
            }
          }

          this.meetingsQueues[NO_MEETING_ID].add({
            pattern,
            channel,
            eventName,
            parsedMessage
          });
        } else {
          if (eventName === 'MeetingEndedEvtMsg' || eventName === 'MeetingDestroyedEvtMsg') {
            // MeetingEndedEvtMsg does not follow the system message pattern for meetingId
            // but we still need to process it on the backend which is processing the rest of the events
            // for this meetingId (it does not contain instanceId either, so we cannot compare that)
            const meetingIdForMeetingEnded = parsedMessage.core.body.meetingId;

            if (!!this.meetingsQueues[meetingIdForMeetingEnded]) {
              this.meetingsQueues[NO_MEETING_ID].add({
                pattern,
                channel,
                eventName,
                parsedMessage
              });
            }
          } // I ignore

        }
      } else {
        // add to existing queue
        if (!!this.meetingsQueues[meetingIdFromMessageCoreHeader]) {
          // only handle message if we have a queue for the meeting. If we don't have a queue, it means it's for a different instanceId
          this.meetingsQueues[meetingIdFromMessageCoreHeader].add({
            pattern,
            channel,
            eventName,
            parsedMessage
          });
        } else {
          Logger.warn('Backend meeting queue had not been initialized', {
            eventName,
            meetingIdFromMessageCoreHeader
          });
        }
      }
    }
  }

  destroyMeetingQueue(id) {
    delete this.meetingsQueues[id];
  }

  on() {
    return this.emitter.on(...arguments);
  }

  publishVoiceMessage(channel, eventName, voiceConf, payload) {
    const header = {
      name: eventName,
      voiceConf
    };
    const envelope = makeEnvelope(channel, eventName, header, payload);
    return this.pub.publish(channel, envelope, RedisPubSub.handlePublishError);
  }

  publishSystemMessage(channel, eventName, payload) {
    const header = {
      name: eventName
    };
    const envelope = makeEnvelope(channel, eventName, header, payload);
    return this.pub.publish(channel, envelope, RedisPubSub.handlePublishError);
  }

  publishMeetingMessage(channel, eventName, meetingId, payload) {
    const header = {
      name: eventName,
      meetingId
    };
    const envelope = makeEnvelope(channel, eventName, header, payload);
    return this.pub.publish(channel, envelope, RedisPubSub.handlePublishError);
  }

  publishUserMessage(channel, eventName, meetingId, userId, payload) {
    const header = {
      name: eventName,
      meetingId,
      userId
    };

    if (!meetingId || !userId) {
      Logger.warn("Publishing ".concat(eventName, " with potentially missing data userId=").concat(userId, " meetingId=").concat(meetingId));
    }

    const envelope = makeEnvelope(channel, eventName, header, payload, {
      meetingId,
      userId
    });
    return this.pub.publish(channel, envelope, RedisPubSub.handlePublishError);
  }

}

const RedisPubSubSingleton = new RedisPubSub();
Meteor.startup(() => {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  RedisPubSubSingleton.updateConfig(REDIS_CONFIG);
  RedisPubSubSingleton.init();
});
module.exportDefault(RedisPubSubSingleton);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/settings.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }

}, 1);
let YAML;
module.link("yaml", {
  default(v) {
    YAML = v;
  }

}, 2);

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 3);
const DEFAULT_SETTINGS_FILE_PATH = process.env.BBB_HTML5_SETTINGS || 'assets/app/config/settings.yml';
const LOCAL_SETTINGS_FILE_PATH = process.env.BBB_HTML5_LOCAL_SETTINGS || '/etc/bigbluebutton/bbb-html5.yml';

try {
  if (fs.existsSync(DEFAULT_SETTINGS_FILE_PATH)) {
    const SETTINGS = YAML.parse(fs.readFileSync(DEFAULT_SETTINGS_FILE_PATH, 'utf-8'));

    if (fs.existsSync(LOCAL_SETTINGS_FILE_PATH)) {
      console.log('Local configuration found! Merging with default configuration...');
      const LOCAL_CONFIG = YAML.parse(fs.readFileSync(LOCAL_SETTINGS_FILE_PATH, 'utf-8'));

      _.merge(SETTINGS, LOCAL_CONFIG);
    } else console.log('Local Configuration not found! Loading default configuration...');

    Meteor.settings = SETTINGS;
    Meteor.settings.public.app.instanceId = ''; // no longer use instanceId in URLs. Likely permanent change
    // Meteor.settings.public.app.instanceId = `/${INSTANCE_ID}`;

    __meteor_runtime_config__.PUBLIC_SETTINGS = SETTINGS.public;
  } else {
    throw new Error('File doesn\'t exists');
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Error on load configuration file.', error);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"utils":{"lineEndings.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/utils/lineEndings.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  BREAK_LINE: () => BREAK_LINE,
  CARRIAGE_RETURN: () => CARRIAGE_RETURN,
  NEW_LINE: () => NEW_LINE
});
// Used in Flash and HTML to show a legitimate break in the line
const BREAK_LINE = '<br/>'; // Soft return in HTML to signify a broken line without
// displaying the escaped '<br/>' line break text

const CARRIAGE_RETURN = '\r'; // Handle this the same as carriage return, in case text copied has this

const NEW_LINE = '\n';
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mimeTypes.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/utils/mimeTypes.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  XLS: () => XLS,
  XLSX: () => XLSX,
  DOC: () => DOC,
  DOCX: () => DOCX,
  PPT: () => PPT,
  PPTX: () => PPTX,
  ODT: () => ODT,
  RTF: () => RTF,
  TXT: () => TXT,
  ODS: () => ODS,
  ODP: () => ODP,
  PDF: () => PDF,
  JPEG: () => JPEG,
  PNG: () => PNG,
  SVG: () => SVG,
  UPLOAD_SUPORTED: () => UPLOAD_SUPORTED
});
const XLS = 'application/vnd.ms-excel';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOC = 'application/msword';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPT = 'application/vnd.ms-powerpoint';
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const ODT = 'application/vnd.oasis.opendocument.text';
const RTF = 'application/rtf';
const TXT = 'text/plain';
const ODS = 'application/vnd.oasis.opendocument.spreadsheet';
const ODP = 'application/vnd.oasis.opendocument.presentation';
const PDF = 'application/pdf';
const JPEG = 'image/jpeg';
const PNG = 'image/png';
const SVG = 'image/svg+xml';
const UPLOAD_SUPORTED = [XLS, XLSX, DOC, DOCX, PPT, PPTX, ODT, RTF, TXT, ODS, ODP, PDF, JPEG, PNG];
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"regex-weburl.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/utils/regex-weburl.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exportDefault(new RegExp( // protocol identifier
'(?:(?:https?|ftp)://)' + // user:pass authentication
'(?:\\S+(?::\\S*)?@)?' + '(?:' + // IP address exclusion
// private & local networks
'(?!(?:10|127)(?:\\.\\d{1,3}){3})' + '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' + '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' + // IP address dotted notation octets
// excludes loopback network 0.0.0.0
// excludes reserved space >= 224.0.0.0
// excludes network & broacast addresses
// (first & last IP address of each class)
'(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' + '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' + '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' + '|' + // host name
"(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" + // domain name
"(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" + // TLD identifier
"(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" + // TLD may end with dot
'\\.?' + ')' + // port number
'(?::\\d{2,5})?' + // resource path
'(?:[/?#]\\S*)?', 'img'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"main.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("/imports/startup/server");
module.link("/imports/api/meetings/server");
module.link("/imports/api/users/server");
module.link("/imports/api/annotations/server");
module.link("/imports/api/cursor/server");
module.link("/imports/api/polls/server");
module.link("/imports/api/captions/server");
module.link("/imports/api/presentations/server");
module.link("/imports/api/presentation-pods/server");
module.link("/imports/api/presentation-upload-token/server");
module.link("/imports/api/slides/server");
module.link("/imports/api/breakouts/server");
module.link("/imports/api/group-chat/server");
module.link("/imports/api/group-chat-msg/server");
module.link("/imports/api/screenshare/server");
module.link("/imports/api/users-settings/server");
module.link("/imports/api/voice-users/server");
module.link("/imports/api/whiteboard-multi-user/server");
module.link("/imports/api/video-streams/server");
module.link("/imports/api/network-information/server");
module.link("/imports/api/users-infos/server");
module.link("/imports/api/connection-status/server");
module.link("/imports/api/note/server");
module.link("/imports/api/external-videos/server");
module.link("/imports/api/guest-users/server");
module.link("/imports/api/local-settings/server");
module.link("/imports/api/voice-call-states/server");
module.link("/imports/api/auth-token-validation/server");
module.link("/imports/api/log-client/server");
module.link("/imports/api/common/server/helpers");
module.link("/imports/startup/server/logger");

let _;

module.link("lodash", {
  default(v) {
    _ = v;
  }

}, 0);
global._ = _;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".jsx",
    ".mjs"
  ]
});

var exports = require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js