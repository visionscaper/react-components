// tutorial10.js

/**
 *
 * <ValidatedInputField
 *              id={string}
 *              value={string}
 *              validity={validity object}
 *              processInput={function(newValue)}
 *              type={"email" | "password" | etc...}
 * />
 *
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

    processTimer : null,


    processInput : function(e) {
        var self = this;
        if (typeof(e)!="object") {
            return;
        }

        var newValue = (e.target || {}).value;
        if (newValue !== this.props.value) {
            if (typeof(this.props.processInput) === "function") {
                if (this.processTimer) {
                    clearTimeout(this.processTimer);
                    this.processTimer = null;
                }

                this.processTimer = setTimeout(function() {
                    self.processTimer = null;
                    self.props.processInput(newValue);
                }, 250);
            }
        }
    },

    render: function() {

        var valObj          = (this.props.validity || {});

        var valid           = valObj.valid;
        var message         = valObj.message;
        var requirements    = valObj.requirements;

        var validityMarkClasses      = "validity-mark";
        validityMarkClasses         += " " + ((valid===true) ? "valid" : "invalid");

        var validityMessageClasses   = "validity-message";
        validityMessageClasses      += " " + ((valid===true) ? "hide" : "");

        return (
                <div id={this.props.id} class="validated-input-field">
                    <div class="input-field-container">
                        <input
                                type={this.props.type}
                                placeholder={this.props.placeholder}
                                value={this.props.value}
                                onChange={this.processInput}
                        />
                        <div class={validityMarkClasses}></div>
                    </div>
                    <div class={validityMessageClasses}>
                        <p>{message}</p>
                        <p>{requirements}</p>
                    </div>
                </div>
               );
    }
});