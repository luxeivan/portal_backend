const axios = require("axios");
const moment = require("moment");
require("dotenv").config();

const server1c = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
    Authorization: server1c_auth,
};

"/InformationRegister_ЦеныНоменклатуры_RecordType/SliceLast(,Condition='ТипЦен_Key eq '[ТипЦены]' and Номенклатура_Key eq '[Номенклатура]'')/?$format=json&$select=Цена"

const otherServices = {
    getPrice: async (type, nomenclature) => {
        try {
            const response = await axios.get(
                `${server1c}/InformationRegister_ЦеныНоменклатуры_RecordType/SliceLast(,Condition='ТипЦен_Key eq guid'${type}' and Номенклатура_Key eq guid'${nomenclature}'')/?$format=json&$select=Цена`,
                {
                    headers,
                }
            );
            console.log('response.data: ', response.data);
            if (!response.data) {
                return false;
            }
            return response.data.value[0]?.Цена;
        } catch (error) {
            console.log('getPrice: ', error.message);
            return false;
        }
    },
}

module.exports = otherServices;