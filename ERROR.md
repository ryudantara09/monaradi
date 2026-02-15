Error creating parcel: PrismaClientValidationError:
Invalid `prisma.parcel.create()` invocation in
/home/maatar/Work/github.com/maatarmed/monaradi/backend/src/routes/parcels.ts:116:44

  113 let finalStatus = status || 'AVAILABLE';
  114 if (customerId && contractId) finalStatus = 'SOLD';
  115
→ 116 const parcel = await prisma.parcel.create({
        data: {
          geometry: "[[0,0]]",
          label: "p1",
          ownerName: null,
          status: "AVAILABLE",
          areaSqm: 1000,
          pricePerSqm: 0,
          totalPrice: 0,
          amountPaid: 0,
          ~~~~~~~~~~
          paymentStatus: "UNPAID",
          terrainId: "826fad63-7dde-4f79-a82f-1e6fe6c95703",
          customerId: null,
          contractId: null,
      ?   id?: String,
      ?   createdAt?: DateTime,
      ?   updatedAt?: DateTime,
      ?   terrain?: TerrainCreateNestedOneWithoutParcelsInput,
      ?   customer?: CustomerCreateNestedOneWithoutPurchasedParcelsInput,
      ?   contract?: ContractCreateNestedOneWithoutParcelsInput,
      ?   documents?: ParcelDocumentCreateNestedManyWithoutParcelInput
        },
        include: {
          customer: true,
          terrain: true
        }
              })

Unknown argument `amountPaid`. Available options are marked with ?.
    at throwValidationException (/home/maatar/Work/github.com/maatarmed/monaradi/backend/node_modules/@prisma/client/src/runtime/core/errorRendering/throwValidationException.
ts:46:9)
    at zr.handleRequestError (/home/maatar/Work/github.com/maatarmed/monaradi/backend/node_modules/@prisma/client/src/runtime/RequestHandler.ts:202:7)
    at zr.handleAndLogRequestError (/home/maatar/Work/github.com/maatarmed/monaradi/backend/node_modules/@prisma/client/src/runtime/RequestHandler.ts:174:12)
    at zr.request (/home/maatar/Work/github.com/maatarmed/monaradi/backend/node_modules/@prisma/client/src/runtime/RequestHandler.ts:143:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async a (/home/maatar/Work/github.com/maatarmed/monaradi/backend/node_modules/@prisma/client/src/runtime/getPrismaClient.ts:807:24)
    at async <anonymous> (/home/maatar/Work/github.com/maatarmed/monaradi/backend/src/routes/parcels.ts:116:24) {
  clientVersion: '7.4.0'
}