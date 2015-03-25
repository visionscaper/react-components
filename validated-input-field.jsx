/**
 *
 * <ValidatedInputField
 *              id={string}
 *              value={string}
 *              defaultValue={string}
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

    processTimer    : null,
    processedValue  : null,

    processInput : function(e) {
        var self = this;
        if (typeof(e)!="object") {
            return;
        }

        var newValue = (e.target || {}).value;
        if (newValue !== this.processedValue) {
            if (typeof(this.props.processInput) === "function") {
                if (this.processTimer) {
                    clearTimeout(this.processTimer);
                    this.processTimer = null;
                }

                this.processTimer = setTimeout(function() {
                    self.processTimer = null;
                    self.processedValue = newValue;
                    self.props.processInput(newValue);
                }, 250);
            }
        }
    },

    render: function() {

        //We want to be able to set the contents of an input field, but at the same time
        //we don't want to change the content when the user is editing the field.
        var value           = (this.props.value !== this.processedValue) ? this.props.value : undefined;
        var defaultValue    = _.def(this.props.value) ? this.props.value : undefined;

        var valObj          = (this.props.validity || {});

        var valid           = (!_.bool(valObj.valid)) || (valObj.valid===true);
        var message         = valObj.message;
        var requirements    = valObj.requirements;

        var validityMarkClasses      = "validity-mark";
        validityMarkClasses         += " " + (valid ? "valid" : "invalid");

        var validityMessageClasses   = "validity-message";
        validityMessageClasses      += " " + (valid ? "hide" : "");

        return (
                <div id={this.props.id} class="validated-input-field">
                    <div className="input-field-container">
                        <input
                                type={this.props.type}
                                placeholder={this.props.placeholder}
                                value={value}
                                defaultValue={defaultValue}
                                onChange={this.processInput}
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