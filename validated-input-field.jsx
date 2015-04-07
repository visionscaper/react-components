/**
 *
 * <ValidatedInputField
 *              label=[{string}]
 *              processInput={function(newValue)}
 *              [id={string}]
 *              [className={string}]
 *              [value={string}}
 *              [defaultValue={string}]
 *              [validity={validity object}]
 *              [onReturnPressed={function()}]
 *              [processMode={"onchange" | "onblur"}]
 *              [throttleDelay={number}]
 *              [type={"email" | "password" | etc...}]
 * />
 *
 * Default for throttleDelay is 0, implying no throttle delay for input processing
 *
 * Default for processMode is "onchange" for type not being "email or password".
 * For "email" and "password" onblur is default.
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
        var self = this;

        console.log("component did mount");

        this.autofillScanner = setInterval(function() {
            var node = React.findDOMNode(self.refs.inputField);
            if (typeof(node) !== "object") {
                return;
            }

            //If it is empty nothing is autofilled
            if ((typeof(node.value) != "string") || (node.value == "")) {
                return;
            }

            if (node.value!==self.lastValueRendered) {
                console.warn('AUTO FILL DETECTED!');

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
        if (typeof(e)!="object") {
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

        if (typeof(e)!="object") {
            return;
        }

        this.processInput((e.target || {}).value)
    },

    processOnBlur : function(e) {
        if (typeof(e)!="object") {
            return;
        }

        this.processInput((e.target || {}).value)
    },

    processKeyPress : function(e) {
        if (typeof(e)!="object") {
            return;
        }

        if (typeof(this.props.onReturnPressed) === "function") {
            var code = e.keyCode || e.which;
            if (code === 13) {
                //Ensure that input in processed before taking action on return
                this.processInput((e.target || {}).value, true); //force to take action now
                this.props.onReturnPressed();
            }
        }
    },

    getProcessMode : function() {
        var processMode     = typeof(this.props.processMode) === "string" ? this.props.processMode.toLowerCase() : null;

        if ((processMode != "onchange") && (processMode != "onblur")) {
            //find default processing mode
            switch (type) {
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

        var validityMessageClasses  = "validity-message";
        validityMessageClasses     += " " + (valid ? "hide" : "");

        var type                    = _.def(this.props.type) ? this.props.type : "text";

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

        var label      =  (typeof(this.props.label) == "string") ?
                <div class="label">{this.props.label}</div> :
                undefined;

        return (
                <div id={this.props.id} className={containerClasses}>
                    <div className="labelled-input-field-container">
                        {label}
                        <div className="input-field-container">
                            <input
                                    type={type}
                                    placeholder={this.props.placeholder}
                                    defaultValue={defaultValue}
                                    value={value}
                                    onChange={onChangeHandler}
                                    onBlur={onBlurHandler}
                                    onKeyPress={onKeyPress}
                                    ref="inputField"
                            />
                            <div className={validityMarkClasses}></div>
                        </div>
                    </div>
                    <div className={validityMessageClasses}>
                        <p>{message}</p>
                        <p>{requirements}</p>
                    </div>
                </div>
               );
    }
});