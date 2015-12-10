function buildLargeSet(itemCount) {
    var o = [];

    
    for (var i = 0; i < itemCount; i++) {

        var vi = {
                valueItem: {
                    valueId: i,
                    valueName: "Value: " + i,
                    languageCode: "English",
                    description: "Value: " + i,
                    displayOrdinal: 0,
                    isActive: true
                }                
            }

            var rs = [];
            var rCount = Math.floor((Math.random() * 20) + 1);// up to 5 relationships
            if (rCount < 5) {
                for (var j = 0; j < rCount; j++) {

                    var rId = Math.floor((Math.random() * i))

                    if (rId > 0) {
                        var r = {
                            valueId: i,
                            type: "NT",
                            description: "Is Child Of",
                            relatedValueId: rId,
                            relatedValueLanguageCode: "English",
                            relatedValueName: "Value: " + rId
                        }

                        rs.push(r);
                    }

                }

                if (rs.length > 0) {
                    vi.relationships = rs;
                }
            }



        o.push(vi);        
        
    }

    return o;

}