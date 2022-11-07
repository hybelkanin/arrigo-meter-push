import fetch from "node-fetch";
import { store, maintainTokens } from "./tokens.js";
import env from "./env.js";

//login and handle token refresh in wrapped functions
await maintainTokens();

const query = async function (query) {
  const response = await fetch(`${env.URL}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${store.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const data = await response.json();
  return data;
};

const main = async function () {
  //list first 200 meters in account
  let result = await query(`query allMeters{
        Meters(first:200){
            edges{
                node{
                    id
                    name
                }
            }
        }
    }`);
  //the response is the same as query, below the "query name object"
  console.log(result.data.Meters.edges);

  const firstMeter = result.data.Meters.edges[0].node;
  console.log(firstMeter);
  //list meter values for a meter
//   result = await query(`query MyQuery {
//     MeterValues(filter: {meterID: "${firstMeter.id}"}) {
//       edges {
//         node {
//           value
//           timestamp
//           resolution
//         }
//       }
//     }
//   }`);
//   //fix array... 
//   let values = result.data.MeterValues.edges.map(edge=>edge.node)
//   console.log(values)

  //store a value for a meter. 
  const value = {
    value: 11000, 
    timestamp: '2022-11-07 18:00:00Z',
    resolution:'month',
    meterId: firstMeter.id,
    type:"reading"
  }

  result = await query(`mutation {
    MeterValues {
      create(data: {
            meter: "${value.meterId}" 
            timestamp: "${value.timestamp}"
            value: ${value.value} 
            resolution: ${value.resolution}
            type: ${value.type}}) {
        value
        id
      }
    }
  }`)
  console.log(result)
};

main();
