#
# A "Hello World" template for iRulesLX RPC.
#
# Note: This example works in concert with the template in an
# extension's default index.js.
#
# To use, replace every item in <> with an appropriate value.
#
# when <EVENT> {
#    # Get a handle to the running extension instance to call into.
#    set RPC_HANDLE [ILX::init <PLUGIN_NAME> <EXTENSION_NAME>]
#    # Make the call and store the response in $rpc_response
#    set rpc_response [ILX::call $RPC_HANDLE <REMOTE_FUNC_NAME> <ARG> <ARG> ...  ]
# }
when CLIENT_ACCEPTED {
 node 127.0.0.1
}

