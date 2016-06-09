/**
 *
 * <ValidatedInputField
 *              label=[{string}]
 *              processInput={function(newValue)}
 *              [id={string}]
 *              [className={string}]
 *              [placeholder={string}]
 *              [value={string}}
 *              [defaultValue={string}]
 *              [validity={validity object}]
 *              [onReturnPressed={function()}]
 *              [processMode={"onchange" | "onblur"}]
 *              [throttleDelay={number}]
 *              [type={"email" | "password" | etc...}]
 *              [logger={logger instance object}]
 * />
 *
 * Default for throttleDelay is 0, implying no throttle delay for input processing
 *
 * Default for processMode is "onchange" for type not being "email or password".
 * For "email" and "password" onblur is default.
 *
 * Default for logger is the console object
 *
 * Validity object:
 * {
 *      valid           : <true || false>,
 *      message         : <descriptions of what is wrong>,
 *      requirements    : <description of the value requirements>,
 * }
 *
 */
var ValidatedInputField = React.createClass({

    logger                      : null,

    lastInternalChange          : null,
    lastExternalValue           : null,
    lastValueSentForProcessing  : null,
    lastValueRendered           : null,

    processingTimer             : null,

    autofillScanner             : null,

    getInitialState : function() {
        return {
            timestamp   : null,
            value       : null
        };
    },

    componentDidMount : function() {
        var me = "ValidatedInputField::componentDidMount";
        var self = this;

        var _l = this.getLogger();

        _l.debug(me, "component did mount");

        this.autofillScanner = setInterval(function() {
            var me = "ValidatedInputField::autofillScanner";

            var node = React.findDOMNode(self.refs.inputField);
            if (node !== Object(node)) {
                return;
            }

            //If it is empty nothing is autofilled
            if ((typeof(node.value) != "string") || (node.value == "")) {
                return;
            }

            if (node.value!==self.lastValueRendered) {
                _l.warn(me, 'AUTO FILL DETECTED!');

                var processMode     = self.getProcessMode();
                var autofillEvent   = {
                    target : {
                        value : node.value
                    }
                };

                if (processMode == "onblur") {
                    self.setValue(autofillEvent)
                } else {
                    self.processOnChange(autofillEvent);
                }
            }
        }, 500);
    },

    setValue       : function(e) {
        if (e !== Object(e)) {
            return;
        }

        var newValue    = (e.target || {}).value;
        this.setState({
            timestamp : (new Date()).getTime(),
            value : newValue
        });
    },

    processInput    : function(newValue, force) {
        var self = this;

        if (typeof(this.props.processInput) !== "function") {
            return;
        }

        if (typeof(force) !== "boolean") {
            force = false;
        }

        var __doProcess = function() {
            self.processingTimer = null;
            self.lastValueSentForProcessing = newValue;
            self.props.processInput(newValue);
        };

        if (_.number(this.props.throttleDelay) &&  this.props.throttleDelay > 0) {
            if (this.processingTimer) {
                clearTimeout(this.processingTimer);
                this.processingTimer = null;
            }

            if (!force) {
                this.processingTimer = setTimeout(function() {
                    __doProcess();
                }, this.props.throttleDelay);
            } else {
                __doProcess();
            }
        } else {
            __doProcess();
        }
    },

    processOnChange : function(e) {
        this.setValue(e);

        if (e !== Object(e)) {
            return;
        }

        this.processInput(this._getValueFromEvent(e));
    },

    processOnBlur : function(e) {
        if (e !== Object(e)) {
            return;
        }

        this.processInput(this._getValueFromEvent(e))
    },

    processKeyPress : function(e) {
        if (e !== Object(e)) {
            return;
        }

        if (typeof(this.props.onReturnPressed) === "function") {
            var code = e.keyCode || e.which;
            if (code === 13) {
                //Ensure that input in processed before taking action on return
                this.processInput(this._getValueFromEvent(e)); //force to take action now
                this.props.onReturnPressed();
            }
        }
    },

    getProcessMode : function() {
        var processMode     = typeof(this.props.processMode) === "string" ? this.props.processMode.toLowerCase() : null;

        if ((processMode != "onchange") && (processMode != "onblur")) {
            //find default processing mode
            switch (type) { // TODO: type undefined
                case "email":
                case "password":
                    processMode = "onblur";
                    break;
                default:
                    processMode = "onchange";
            }
        }

        return processMode;
    },

    getInputField : function() {
        return this.refs.inputField;
    },

    getFieldType : function() {
        return (typeof(this.props.type) == "string") ? this.props.type.toLowerCase() : "text";
    },

    //Fix for older version of reactjs (at least 0.13)
    fixValue : function(value) {
        if (typeof value === 'undefined' || value === null) {
            return '';
        }
        return value;
    },

    render: function() {
        var value = undefined;

        var internalValueChanged = (this.lastInternalChange !== this.state.timestamp);
        var externalValueChanged = (this.lastExternalValue !== this.props.value);
        var externalValueEqualsLastProcessed = (this.lastValueSentForProcessing === this.props.value);

        if (externalValueChanged && !externalValueEqualsLastProcessed) {
            //External controller really tries to change the value
            value = this.props.value;
        } else if (internalValueChanged) {
            //User is typing
            value = this.state.value;
        } else {
            value = this.lastValueRendered;
        }

        //lastValueSentForProcessing is used to capture the situation where a value sent for processing is
        // given back after processing. In that situation no external value update is required.
        // However, it can occur that the internal value is updated and sent for processing, after that the value is
        // changed externally, and then after that the value is changed externally back to the original value that was
        // set internally.
        //
        //If we don't reset the lastValueSentForProcessing when the externalValueChanged has changed, above special
        // case can occur. 'lastValueSentForProcessing' only needs to be used once to capture the internally changed value
        // that is given back after processing by a controller. After that it needs to be reset.
        if (externalValueChanged) {
            this.lastValueSentForProcessing = undefined;
        }

        var type                    = this.getFieldType(this.props.type);

        value                       = (type != "textarea") ? value : this.fixValue(value);

        this.lastInternalChange     = this.state.timestamp;
        this.lastExternalValue      = this.props.value;
        this.lastValueRendered      = value;

        var defaultValue            = this.props.defaultValue;

        var valObj                  = (this.props.validity || {});

        var valid                   = (typeof(valObj.valid) !== "boolean") || (valObj.valid===true);
        var message                 = valObj.message;
        var requirements            = valObj.requirements;

        var validityMarkClasses     = "validity-mark";
        validityMarkClasses        += " " + (valid ? "valid" : "invalid");

        var validityMessageClasses  = "message validity";
        validityMessageClasses     += " " + (valid ? "hide" : "");

        var containerClasses        = "validated-input-field " + type;
        var className               = this.props.className;
        if ((typeof(className) == "string") && (className.length > 0)) {
            containerClasses += " " + className;
        }

        var processMode     = this.getProcessMode();
        var onChangeHandler = undefined;
        var onBlurHandler   = undefined;

        if (processMode == "onchange") {
            onChangeHandler = this.processOnChange;
        } else if (processMode == "onblur") {
            onBlurHandler   = this.processOnBlur;
            onChangeHandler = this.setValue;
        }

        var onKeyPress = undefined;
        if (typeof(this.props.onReturnPressed) === "function") {
            onKeyPress = this.processKeyPress;
        }

        var label;
        if(_.func(this.props.label)) {
            label = this.props.label();
        } else {
            label      =  (typeof(this.props.label) == "string") ?
                <div className="label">{this.props.label}</div> :
                undefined;
        }

        var inlineLabel = '', fullLineLabel = '';
        if(type === 'checkbox') {
            inlineLabel = <div className="label inline">{label}</div>;
        } else {
            fullLineLabel = <div className="label">{label}</div>;
        }

        var instructions = _.string(this.props.instructions) ? <div className="field-instructions">{this.props.instructions}</div> : '';

        var inputField = (type != "textarea") ?
                <input
                        type={type}
                        placeholder={this.props.placeholder}
                        defaultValue={defaultValue}
                        value={value}
                        onChange={onChangeHandler}
                        onBlur={onBlurHandler}
                        onKeyPress={onKeyPress}
                        ref="inputField"
                /> :
                <textarea
                        placeholder={this.props.placeholder}
                        defaultValue={defaultValue}
                        value={value}
                        onChange={onChangeHandler}
                        onBlur={onBlurHandler}
                        onKeyPress={onKeyPress}
                        ref="inputField"
                />;

        return (
                <div id={this.props.id} className={containerClasses}>
                    <div className="labelled-input-field-container">
                        {fullLineLabel}
                        <div className="input-field-container">
                            {inputField}
                            {inlineLabel}
                            <div className={validityMarkClasses}></div>
                        </div>
                        {instructions}
                    </div>
                    <div className={validityMessageClasses}>
                        <p>{message}</p>
                        <p>{requirements}</p>
                    </div>
                </div>
               );
    },

    getLogger : function() {
        return (this.logger = this.logger || this.props.logger || console);
    },

    _getValueFromEvent : function(e) {
        var value;
        if(this.props.type === 'checkbox') {
            value = _.get(e, 'target.checked');
        } else {
            value = (e.target || {}).value;
        }
        return value;
    }
});