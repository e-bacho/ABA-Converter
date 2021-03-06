var type0rowRules = [];
type0rowRules[0] = "0"; // must be 0
type0rowRules[1] = "1";
type0rowRules[2] = "+3"; // must have exactly 3 characters
type0rowRules[3] = "-"; // must not be blank
type0rowRules[4] = "+6";
type0rowRules[5] = "-";
type0rowRules[6] = "+6";

var type1rowRules = [];
type1rowRules[0] = "1";
type1rowRules[1] = "+7";
type1rowRules[2] = "-";
type1rowRules[4] = "+2";
type1rowRules[5] = "+10";
type1rowRules[6] = "-";
type1rowRules[7] = "-";
type1rowRules[8] = "+7";
type1rowRules[9] = "-";
type1rowRules[10] = "-";
type1rowRules[11] = "+8";

var type7rowRules = [];
type7rowRules[0] = "7";
type7rowRules[1] = "999-999";
type7rowRules[2] = "+10";
type7rowRules[3] = "+10";
type7rowRules[4] = "+10";
type7rowRules[5] = "+6";

var indicatorValues = ['n', 'w', 'x', 'y']; // Indicator column optional values
var transactionCodes = ['13', '50', '51', '52', '53', '54', '55', '56', '57']; // Transaction code column options

// Character count for each row and column
var type0charactersLimit = [18, 2, 10, 26, 6, 12, 46];
var type7charactersLimit = [1, 19, 10, 10, 34, 46];
var type1charactersLimit = [1, 7, 9, 1, 2, 10, 32, 18, 7, 9, 16, 8];

function generateABAFile(result)
{
	// Convert string to array
	var arrayResult = CSVToArray(result);

	// Remove blank rows and header rows
	arrayResult.removeHeaderAndEmptyRows();

	// Validate data (ABA general rules)
	var result = arrayResult.validateABA();
	if (result.success == true)
	{
		// Build output and download
		return buildABA(arrayResult);
	}
	else
	{
		return result.error;
	}
}

// Converts the csv string to 2D array [row][cell]
function CSVToArray(strData, strDelimiter)
{
	// Check to see if the delimiter is defined. If not, then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);

	// Create an array to hold our data. Give the array a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches until we can no longer find a match.
	while (arrMatches = objPattern.exec(strData))
	{
		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[1];

		// Check to see if the given delimiter has a length (is not the start of string) and if it matches field delimiter. If id does not, then we know that this delimiter is a row delimiter.
		if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter)
		{
			// Since we have reached a new row of data, add an empty row to our data array.
			arrData.push([]);
		}

		var strMatchedValue;

		// Now that we have our delimiter out of the way, let's check to see which kind of value we captured (quoted or unquoted).
		if (arrMatches[2])
		{
			// We found a quoted value. When we capture this value, unescape any double quotes.
			strMatchedValue = arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"");
		}
		else
		{
			// We found a non-quoted value.
			strMatchedValue = arrMatches[3];
		}

		// Now that we have our value string, let's add it to the data array.
		arrData[arrData.length - 1].push(strMatchedValue);
	}

	// Return the parsed data.
	return(arrData);
}

// Removes header or empty rows
Array.prototype.removeHeaderAndEmptyRows = function()
{
	var indexesToRemove = [];

	// Get the row indexes for each empty or header row
	for (var i = 0; i < this.length; i++)
	{
		if (isNaN(parseInt(this[i][0])))
		{
			indexesToRemove.push(i);
		}
	}

	// And remove thsoe rows from the array of data
	for (var i = this.length - 1; i >= 0; i--)
	{
		if (indexesToRemove.indexOf(i) != -1)
		{
			// remove element
			this.splice(i, 1);
		}
	}
}

// Validate the ABA file - specific rules
Array.prototype.validateABA = function()
{
	var lastRowIndex = this.length - 1;
	var error = '';

	if (this.length < 3)
	{
		error += 'The file must have at least 3 rows with data' + '\n';
	}

	for (var i = 0; i < this.length; i++)
	{
		var rules = [];

		switch (i)
		{
			case 0: rules = type0rowRules; break; // first row - type 0 rules apply
			case lastRowIndex: rules = type7rowRules; break; // last row - type 7 rules apply
			default: rules = type1rowRules; break; // any other row in between - type 1 rules apply
		}

		// Check the rules for each row type (only fixed values or number or characters as per the rule arrays specified)
		for (var j = 0; j < this[i].length; j++)
		{
			if (rules[j] != undefined && rules[j] != '-' && rules[j].indexOf('+') == -1 && rules[j] != this[i][j])
			{
				// Must have specific value
				error += 'Data row ' + (i + 1) + ', cell ' + (j + 1) + ' - the value must be ' + rules[j] + '\n';
			}
			else if (rules[j] != undefined && rules[j] != '-' && rules[j].indexOf('+') != -1 && this[i][j].length != rules[j].split('+')[1])
			{
				// error += 'Data row ' + (i + 1) + ', cell ' + (j + 1) + ' - the value must have exactly ' + rules[j].split('+')[1] + ' characters' + '\n';

				// Must be filled with leading zeros
				var length = this[i][j].length;
				var limit = rules[j].split('+')[1];

				if (length < limit)
				{
					for (var k = 0; k < limit - length; k++)
					{
						this[i][j] = '0' + this[i][j];
					}
				}
			}
			else if (rules[j] != undefined && rules[j] == '-' && this[i][j] == '')
			{
				// Must have a value
				error += 'Missing value for data row ' + (i + 1) + ', cell ' + (j + 1) + '\n';
			}

			// Append leading zero for reel sequence number
			if (i == 0 && j == 1)
			{
				this[i][j] = '0' + this[i][j];
			}
		}

		// Check specific fields and values e.g. contains - in the middle or value matches set of values
		if (i > 0 && i < lastRowIndex)
		{
			if (this[i][1].indexOf('-') != 3)
			{
				error += 'Bank/State/Branch number for data row ' + (i + 1) + ' must have a hyphen on the 4th position' + '\n';
			}

			if (this[i][3] != '' && indicatorValues.indexOf(this[i][3].toLowerCase()) == -1)
			{
				error += 'Invalid Indicator value for data row ' + (i + 1) + '\n';
			}

			if (this[i][4] != '' && transactionCodes.indexOf(this[i][4]) == -1)
			{
				error += 'Invalid Transaction code value for data row ' + (i + 1) + '\n';
			}

			if (this[i][8].indexOf('-') != 3)
			{
				error += 'Trace record (BSB) for data row ' + (i + 1) + ' must have a hyphen on the 4th position' + '\n';
			}
		}
	}

	if (error != '')
	{
		return {'success' : false, 'error' : error};
	}

	return {'success' : true, 'error' : ''};
}

// Helper functions for building the final ABA string
function StringBuilder ()
{
	var values = [];

	return {
		append: function (value)
		{
			values.push(value);
		},
		appendAndAlignLeft: function (value, limit)
		{
			var length = value.length;

			if (length > limit)
			{
				value = value.substring(0, limit);
			}

			for (var i = length; i < limit; i++)
			{
				value += ' ';
			}

			values.push(value);
		},
		appendAndAlignRight: function (value, limit)
		{
			var length = value.length;

			if (length > limit)
			{
				value = value.substring(0, limit);
			}

			for (var i = 0; i < limit - length; i++)
			{
				value = ' ' + value;
			}

			values.push(value);
		},
		toString: function ()
		{
			return values.join('');
		}
	};
}

function buildABA(arrayResult)
{
	var typeXcharactersLimit;

	// The final output string
	var ABAString = new StringBuilder();

	for (var i = 0; i < arrayResult.length; i++)
	{
		switch(i)
		{
			case 0: typeXcharactersLimit = type0charactersLimit; break;
			case arrayResult.length - 1: typeXcharactersLimit = type7charactersLimit; break;
			default: typeXcharactersLimit = type1charactersLimit; break;
		}

		for (var j = 0; j < arrayResult[i].length; j++)
		{
			if (typeXcharactersLimit[j] != undefined)
			{
				if (i > 0 && i < arrayResult.length - 1 && (j == 2 || j == 9))
				{
					ABAString.appendAndAlignRight(arrayResult[i][j], typeXcharactersLimit[j]);
				}
				else
				{
					ABAString.appendAndAlignLeft(arrayResult[i][j], typeXcharactersLimit[j]);
				}
			}
		}

		ABAString.append('\n');
	}

	return ABAString.toString();
}

module.exports.generateABAFile = generateABAFile;