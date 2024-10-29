export class Type {
    text : string

    constructor(text) {
        this.text = text
    }
}

export class Identifier {
    type: Type
    value: string
    system: string

    constructor(type,value) {
        this.type = type
        this.value = value
    }
}

export class Name {
    familyName : string
    givenName : Array<string>
    use : string

    constructor(familyName,givenName,use=""){
        this.familyName = familyName
        this.givenName = givenName
        this.use = use;
    }
}

export class Telecom {
    system : string
    value : string

    constructor(system,value) {
        this.system = system
        this.value = value
    }
}

export class Address {
    line: Array<string>
    city: string
    district: string
    state: string
    postalCode: number
    country: string

    constructor(line,city,district,state,postalCode,country) {
        this.line = line
        this.city = city
        this.district = district
        this.state = state
        this.postalCode = postalCode
        this.country = country
    }

}

export class Coding {
    system : string
    code: string

    constructor(system,code) {
        this.system = system
        this.code = code
    }
}
export class RelationShip {
    coding : Array<Coding>

    constructor(coding) {
        this.coding = [coding]
    }
}

export class Contact {
    name : Array<Name>
    relationShip : RelationShip
    telecom : Array<Telecom>

    constructor(name,relationShip,telecom) {
        this.name = name
        this.relationShip = relationShip
        this.telecom = [telecom]
    }
}

export const GENDER = {
    MALE : "male",
    FEMALE : "female",
    OTHER : "other",
    UNKNOWN : "unknown"
}

export class FhirPatient {
    id : string
    identifiers: Array<Identifier>
    gender : GENDER
    names : Array<Name>
    birthDate : string
    isBirthDateEstimated : Boolean
    address: Array<Address>
    contactPoint : Array<Telecom>
    contact : Array<Contact>

    constructor(id,identifier,name,gender,dob,isBirthDateEstimated,address,telecom,contact) {
        this.id = id
        this.gender = gender
        this.identifiers= identifier
        this.names = name ? [name] : null
        this.birthDate = dob
        this.isBirthDateEstimated = isBirthDateEstimated
        this.address = address ? [address] : null
        this.contactPoint = telecom ? [telecom] : null
        this.contact = contact ? [contact] : null
    }
}