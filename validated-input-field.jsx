/**
 *
 * <ValidatedInputField
 *              id={string}
 *              value={string}
 *              defaultValue={string}
 *              validity={validity object}
 *              processInput={function(newValue)}
 *              processMode={"onchange" | "onblur"}
 *              throttleDelay={number}
 *              type={"email" | "password" | etc...}
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

    lastInternalValue           : null,
    lastExternalValue           : null,
    lastValueSentForProcessing  : null,
    lastValueRendered           : null,

    processingTimer             : null,

    getInitialState : function() {
        return {
            value : null
        };
    },

    setValue       : function(e) {
        if (typeof(e)!="object") {
            return;
        }

        var newValue    = (e.target || {}).value;
        this.setState({value : newValue});
    },

    processInput    : function(newValue) {
        var self = this;

        if (typeof(this.props.processInput) !== "function") {
            return;
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

            this.processingTimer = setTimeout(function() {
                __doProcess();
            }, this.props.throttleDelay);
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

    render: function() {
        var value = undefined;

        var internalValueChanged = (this.lastInternalValue !== this.state.value);
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

        this.lastInternalValue      = this.state.value;
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

        var processMode     = typeof(this.props.processMode) === "string" ? this.props.processMode.toLowerCase() : null;
        var onChangeHandler = undefined;
        var onBlurHandler   = undefined;

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

        if (processMode == "onchange") {
            onChangeHandler = this.processOnChange;
        } else if (processMode == "onblur") {
            onBlurHandler   = this.processOnBlur;
            onChangeHandler = this.setValue;
        }

        return (
                <div id={this.props.id} className="validated-input-field">
                    <div className="input-field-container">
                        <input
                                type={this.props.type}
                                placeholder={this.props.placeholder}
                                defaultValue={defaultValue}
                                value={value}
                                onChange={onChangeHandler}
                                onBlur={onBlurHandler}
                                ref="inputField"
                        />
                        <div className={validityMarkClasses}></div>
                    </div>
                    <div className={validityMessageClasses}>
                        <p>{message}</p>
                        <p>{requirements}</p>
                    </div>
                </div>
               );
    }
});